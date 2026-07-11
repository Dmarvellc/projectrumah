import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { blobDbEnabled } from "@/lib/db-blob";

export const runtime = "nodejs";

// GET — status konfigurasi penyimpanan (tanpa menyentuh jaringan).
export async function GET() {
  return NextResponse.json({
    onVercel: Boolean(process.env.VERCEL),
    blobConfigured: blobDbEnabled(),
  });
}

// POST — tes NYATA: tulis blob kecil, baca balik, hapus.
// Membuktikan token benar-benar bekerja, bukan sekadar terpasang.
export async function POST() {
  if (!blobDbEnabled()) {
    return NextResponse.json(
      { ok: false, error: "BLOB_READ_WRITE_TOKEN tidak ada di deployment ini." },
      { status: 400 }
    );
  }
  try {
    const stamp = `tes-${Date.now()}`;
    const { url } = await put(`db/storage-test.txt`, stamp, {
      access: "public",
      contentType: "text/plain",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    const back = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" }).then((r) => r.text());
    await del(url).catch(() => {});
    if (back !== stamp) throw new Error("Isi yang dibaca tidak sama dengan yang ditulis.");
    return NextResponse.json({ ok: true });
  } catch (err) {
    let msg = String(err?.message || err);
    if (/private store|private access/i.test(msg)) {
      msg =
        "Store Blob kamu bertipe PRIVATE — foto properti butuh store PUBLIC agar bisa tampil di website. " +
        "Solusi: Vercel → Storage → hapus store lama → Create → Blob → pilih akses PUBLIC → Connect Project → Redeploy.";
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
