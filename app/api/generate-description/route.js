import { NextResponse } from "next/server";
import { generateListing } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { details = {}, images = [] } = body || {};

    // Basic guard on payload size (images are base64)
    const safeImages = (Array.isArray(images) ? images : [])
      .filter((i) => i && i.data && i.media_type)
      .slice(0, 6);

    const result = await generateListing({ details, images: safeImages });
    return NextResponse.json(result);
  } catch (err) {
    console.error("generate-description route error:", err);
    return NextResponse.json(
      { error: "Gagal membuat deskripsi", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
