import { NextResponse } from "next/server";
import { geocode } from "@/lib/geo";

export const runtime = "nodejs";

// POST { location } → { lat, lng, source } — untuk pratinjau & geser pin di form.
export async function POST(req) {
  try {
    const { location } = await req.json();
    const geo = await geocode(location);
    if (!geo) return NextResponse.json({ error: "Lokasi tidak ditemukan — geser pin manual dari titik kota" }, { status: 404 });
    return NextResponse.json(geo);
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
