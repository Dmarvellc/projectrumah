import { NextResponse } from "next/server";
import { generateMarketing } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { listing = {} } = await req.json();
    const result = await generateMarketing({ listing });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
