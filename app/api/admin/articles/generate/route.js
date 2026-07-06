import { NextResponse } from "next/server";
import { generateArticle } from "@/lib/ai";
import { articleBlocks, articleCover } from "@/lib/articles";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topik wajib" }, { status: 400 });
    const gen = await generateArticle({ topic });
    return NextResponse.json({ ...gen, body: articleBlocks(gen), cover: articleCover(gen.category) });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
