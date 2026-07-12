import { NextResponse } from "next/server";
import { suggestImages, buildCoverSvg } from "@/lib/images";
import { getBrand } from "@/lib/store";

export const runtime = "nodejs";

// Galeri = HANYA foto asli yang diunggah penjual (uploadedUrls), dengan foto
// pilihan AI (coverIndex) di urutan pertama. Tanpa foto → galeri kosong
// (UI menampilkan "Foto menyusul") — tidak pernah foto stok/palsu.
export async function POST(req) {
  try {
    const { listing = {}, uploadedUrls = [], coverIndex = 0 } = await req.json();

    let gallery = [];
    let usedUploads = false;
    if (uploadedUrls.length) {
      const idx = coverIndex >= 0 && coverIndex < uploadedUrls.length ? coverIndex : 0;
      gallery = [uploadedUrls[idx], ...uploadedUrls.filter((_, i) => i !== idx)];
      usedUploads = true;
    }

    const coverSvg = buildCoverSvg({ ...listing, images: gallery, brandName: getBrand().brandName });
    return NextResponse.json({ gallery, coverSvg, usedUploads });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
