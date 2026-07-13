import { NextResponse } from "next/server";
import { generateVideoScript } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { listing = {}, scenes = [] } = body || {};

    if (!listing.title) {
      return NextResponse.json({ error: "Data listing tidak lengkap" }, { status: 400 });
    }

    const result = await generateVideoScript({ listing, scenes });
    return NextResponse.json(result);
  } catch (err) {
    console.error("API /api/admin/video/script error:", err);
    return NextResponse.json(
      { error: "Gagal membuat naskah video", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
