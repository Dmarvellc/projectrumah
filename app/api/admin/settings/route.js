import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req) {
  const body = await req.json();
  const current = getSettings();
  const daily = { ...current.dailyArticle, ...(body.dailyArticle || {}) };
  if (typeof body.topicsText === "string") {
    daily.topics = body.topicsText.split("\n").map((t) => t.trim()).filter(Boolean);
  }
  const next = updateSettings({ dailyArticle: daily });
  return NextResponse.json(next);
}
