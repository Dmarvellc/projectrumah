import { NextResponse } from "next/server";
import { suggestImages, buildCoverSvg } from "@/lib/images";

export const runtime = "nodejs";

// Galeri = foto asli yang diunggah penjual (uploadedUrls), dengan foto
// pilihan AI (coverIndex) di urutan pertama. Foto stok HANYA dipakai
// bila penjual tidak mengunggah foto sama sekali.
export async function POST(req) {
  try {
    const { listing = {}, uploadedUrls = [], coverIndex = 0 } = await req.json();

    let gallery;
    let usedUploads = false;
    if (uploadedUrls.length) {
      const idx = coverIndex >= 0 && coverIndex < uploadedUrls.length ? coverIndex : 0;
      gallery = [uploadedUrls[idx], ...uploadedUrls.filter((_, i) => i !== idx)];
      usedUploads = true;
    } else {
      gallery = suggestImages(listing.type, 3);
    }

    const coverSvg = buildCoverSvg({ ...listing, images: gallery });
    return NextResponse.json({ gallery, coverSvg, usedUploads });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
