import { NextResponse } from "next/server";
import { generateArticle } from "@/lib/ai";
import { articleBlocks } from "@/lib/articles";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  try {
    const { topic, audience } = await req.json();
    if (!topic || !String(topic).trim()) {
      return NextResponse.json({ error: "Topik wajib diisi" }, { status: 400 });
    }
    const result = await generateArticle({ topic: String(topic).trim(), audience });
    return NextResponse.json({ ...result, body: articleBlocks(result) });
  } catch (err) {
    console.error("generate-article route error:", err);
    return NextResponse.json(
      { error: "Gagal membuat artikel", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
