import { NextResponse } from "next/server";
import { saveImagesToUploads } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST { images: [{ media_type, data(base64) }] } → simpan (Blob di produksi,
// /public/uploads di lokal), balas URL agar foto asli dipakai di semua materi.
// Bila penyimpanan mustahil (Vercel tanpa Blob) → error JELAS, bukan diam-diam pakai stok.
export async function POST(req) {
  try {
    const { images = [] } = await req.json();
    const urls = await saveImagesToUploads(images, { throwIfImpossible: true });
    if (images.length && !urls.length) {
      return NextResponse.json({ error: "Penyimpanan foto gagal — coba lagi atau cek log server." }, { status: 500 });
    }
    return NextResponse.json({ urls });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
