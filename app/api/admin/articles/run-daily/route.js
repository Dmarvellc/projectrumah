import { NextResponse } from "next/server";
import { runDailyArticle } from "@/lib/daily";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  const result = await runDailyArticle();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
