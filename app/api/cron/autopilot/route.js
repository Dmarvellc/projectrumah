import { NextResponse } from "next/server";
import { runQueueNext } from "@/lib/autopilot";

export const runtime = "nodejs";
export const maxDuration = 300;

// Dipanggil scheduler (Vercel Cron / cron eksternal): proses satu
// spesifikasi terdepan dari antrean otomasi menjadi listing terbit.
// Amankan dengan Authorization: Bearer <CRON_SECRET> atau ?secret=
function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // demo: izinkan bila secret belum diset
  const auth = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function handle(req) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runQueueNext();
    // Antrean kosong bukan kegagalan sistem — balas 200 agar cron tidak alarm.
    return NextResponse.json(result, { status: result.ok || result.error === "Antrean kosong" ? 200 : 500 });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
