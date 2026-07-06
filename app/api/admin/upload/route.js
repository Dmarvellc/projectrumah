import { NextResponse } from "next/server";
import { saveImagesToUploads } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST { images: [{ media_type, data(base64) }] } → simpan ke /public/uploads,
// balas URL lokal agar foto asli penjual dipakai di listing & PPT.
export async function POST(req) {
  try {
    const { images = [] } = await req.json();
    return NextResponse.json({ urls: saveImagesToUploads(images) });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
