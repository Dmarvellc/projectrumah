import { NextResponse } from "next/server";
import { generateArticle } from "@/lib/ai";
import { articleBlocks, articleCover } from "@/lib/articles";
import { allArticles, saveArticle, deleteArticle, addJob } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

// GET — semua artikel (untuk dashboard marketing)
export async function GET() {
  return NextResponse.json({ articles: allArticles() });
}

// POST { topic, audience?, publish=true } — tulis artikel long-form utuh
// (judul, 5-6 bagian ber-heading, gambar editorial) lalu terbitkan.
export async function POST(req) {
  try {
    const { topic, audience, publish = true } = await req.json();
    if (!String(topic || "").trim()) {
      return NextResponse.json({ error: "Topik wajib" }, { status: 400 });
    }

    const gen = await generateArticle({ topic: String(topic).trim(), audience });
    const body = articleBlocks(gen);
    const record = saveArticle({
      title: gen.title || topic,
      excerpt: gen.excerpt || "",
      category: gen.category || "Tips & Panduan",
      readMinutes: gen.readMinutes || 6,
      body,
      keywords: gen.keywords || [topic],
      cover: articleCover(gen.category),
      status: publish ? "published" : "draft",
    });
    addJob({ type: "article", title: record.title, slug: record.slug, result: `/artikel/${record.slug}`, aiUsed: gen.aiUsed });

    const words = body.filter((b) => b.t === "p").map((b) => b.text).join(" ").split(/\s+/).length;
    return NextResponse.json({
      ok: true,
      slug: record.slug,
      url: `/artikel/${record.slug}`,
      title: record.title,
      excerpt: record.excerpt,
      category: record.category,
      cover: record.cover,
      words,
      readMinutes: record.readMinutes,
      aiUsed: gen.aiUsed,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// DELETE { slug }
export async function DELETE(req) {
  try {
    const { slug } = await req.json();
    deleteArticle(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
