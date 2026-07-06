import { NextResponse } from "next/server";
import { saveArticle, addJob } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { article = {} } = await req.json();
    if (!article.title || !Array.isArray(article.body) || !article.body.length) {
      return NextResponse.json({ error: "Judul dan isi artikel wajib" }, { status: 400 });
    }
    const record = saveArticle({
      title: article.title,
      excerpt: article.excerpt || "",
      category: article.category || "Panduan",
      readMinutes: article.readMinutes || 5,
      body: article.body,
      keywords: article.keywords || [],
      cover: article.cover || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
      status: "published",
    });
    addJob({ type: "article", title: record.title, slug: record.slug, result: `/artikel/${record.slug}` });
    return NextResponse.json({ ok: true, slug: record.slug, url: `/artikel/${record.slug}` });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
