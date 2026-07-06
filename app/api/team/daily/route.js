import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";
import { runDailyArticle } from "@/lib/daily";

export const runtime = "nodejs";
export const maxDuration = 300;

// GET — pengaturan otomasi artikel harian
export async function GET() {
  return NextResponse.json(getSettings().dailyArticle || {});
}

// POST { action:"run-now" } | { topics:[], enabled }
export async function POST(req) {
  try {
    const body = await req.json();
    if (body.action === "run-now") {
      const result = await runDailyArticle();
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
    const daily = getSettings().dailyArticle || {};
    const next = {
      ...daily,
      ...(Array.isArray(body.topics) ? { topics: body.topics.filter(Boolean) } : {}),
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
    };
    updateSettings({ dailyArticle: next });
    return NextResponse.json({ ok: true, dailyArticle: next });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
