import { NextResponse } from "next/server";
import { runAutoBatch } from "@/lib/autopilot";

export const runtime = "nodejs";
export const maxDuration = 300;

// Jalankan pipeline otomasi sekarang (satu/banyak spesifikasi dipisah "---",
// atau satu spesifikasi + foto yang dianalisis AI).
export async function POST(req) {
  try {
    const { specs = "", publish = true, marketing = true, images = [] } = await req.json();
    if (!String(specs).trim()) {
      return NextResponse.json({ error: "Spesifikasi kosong" }, { status: 400 });
    }
    const result = await runAutoBatch(specs, { publish, marketing, images });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
