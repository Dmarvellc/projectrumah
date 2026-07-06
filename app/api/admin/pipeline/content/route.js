import { NextResponse } from "next/server";
import { generateListing } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { details = {}, images = [] } = await req.json();
    const safe = (Array.isArray(images) ? images : [])
      .filter((i) => i && i.data && i.media_type)
      .slice(0, 6);
    const result = await generateListing({ details, images: safe });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
