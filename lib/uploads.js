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

// images: [{ media_type, data(base64) }] → [urls]
export async function saveImagesToUploads(images = []) {
  if (!images.length) return [];

  // 1) Vercel Blob — storage produksi (foto tetap ada setelah redeploy)
  if (blobEnabled()) {
    const urls = [];
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
        console.error("blob put gagal:", err?.message || err);
      }
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
