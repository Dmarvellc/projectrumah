import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxy gambar same-origin untuk Video Studio: canvas tidak pernah "tainted"
// apa pun sumber fotonya (Unsplash, Vercel Blob, dsb). Khusus admin
// (dilindungi middleware). Hanya http(s) publik.
export async function GET(req) {
  try {
    const url = new URL(req.url).searchParams.get("url") || "";
    const target = new URL(url);
    if (!/^https?:$/.test(target.protocol)) throw new Error("Protokol tidak diizinkan");
    if (/^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(target.hostname)) throw new Error("Host tidak diizinkan");

    const res = await fetch(target, { headers: { "User-Agent": "RumahPlus/1.0" } });
    if (!res.ok) return NextResponse.json({ error: `Sumber ${res.status}` }, { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 400 });
  }
}
