// Simpan foto → URL. Prioritas: Vercel Blob (persisten & publik) bila
// BLOB_READ_WRITE_TOKEN diset; jika tidak, tulis ke /public/uploads (lokal).
// Semua jalur gagal dengan aman (balas []) agar pipeline tak pernah crash.
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { shortId } from "@/lib/slug";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Pesan jelas saat foto tidak mungkin disimpan (Vercel tanpa Blob).
// Dulu gagal senyap → sistem diam-diam pakai foto stok; sekarang bersuara.
export const BLOB_REQUIRED_MSG =
  "Foto tidak bisa disimpan: Vercel Blob belum terhubung. Buka Vercel → Storage → Create → Blob → Connect ke project ini, lalu redeploy. Setelah itu foto upload dipakai penuh di halaman, PPT, brosur & video.";

// images: [{ media_type, data(base64) }] → [urls]
// throwIfImpossible: lempar error jelas bila penyimpanan mustahil (produksi tanpa Blob).
export async function saveImagesToUploads(images = [], { throwIfImpossible = false } = {}) {
  if (!images.length) return [];

  if (!blobEnabled() && process.env.VERCEL && throwIfImpossible) {
    throw new Error(BLOB_REQUIRED_MSG);
  }

  // 1) Vercel Blob — storage produksi (foto tetap ada setelah redeploy)
  if (blobEnabled()) {
    const urls = [];
    let firstErr = null;
    for (const img of images.slice(0, 12)) {
      try {
        const ext = EXT[img.media_type] || "jpg";
        const buf = Buffer.from(img.data, "base64");
        const { url } = await put(`listings/${Date.now().toString(36)}-${shortId()}.${ext}`, buf, {
          access: "public",
          contentType: img.media_type || "image/jpeg",
        });
        urls.push(url);
      } catch (err) {
        firstErr = firstErr || err;
        console.error("blob put gagal:", err?.message || err);
      }
    }
    // Semua gagal → suarakan alasan ASLI (mis. store private), jangan generik.
    if (!urls.length && firstErr && throwIfImpossible) {
      let msg = String(firstErr?.message || firstErr);
      if (/private store|private access/i.test(msg)) {
        msg =
          "Store Blob kamu bertipe PRIVATE — foto properti butuh store PUBLIC. " +
          "Vercel → Storage → buat store Blob baru dgn akses PUBLIC → Connect Project → Redeploy.";
      }
      throw new Error(msg);
    }
    return urls;
  }

  // 2) Lokal — tulis ke /public/uploads (dilayani statis oleh Next)
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const urls = [];
    for (const img of images.slice(0, 12)) {
      const ext = EXT[img.media_type] || "jpg";
      const name = `${Date.now().toString(36)}-${shortId()}.${ext}`;
      fs.writeFileSync(path.join(dir, name), Buffer.from(img.data, "base64"));
      urls.push(`/uploads/${name}`);
    }
    return urls;
  } catch (err) {
    console.error("saveImagesToUploads gagal (FS read-only?):", err?.message || err);
    return [];
  }
}
