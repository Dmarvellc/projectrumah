import { NextResponse } from "next/server";
import { runDailyArticle } from "@/lib/daily";

export const runtime = "nodejs";
export const maxDuration = 120;

// Dipanggil oleh scheduler (Vercel Cron / cron eksternal).
// Amankan dengan header Authorization: Bearer <CRON_SECRET> atau ?secret=
function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // demo: izinkan bila secret belum diset
  const auth = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function handle(req) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runDailyArticle();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export const GET = handle;
export const POST = handle;
