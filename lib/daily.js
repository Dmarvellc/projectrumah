import { generateArticle } from "@/lib/ai";
import { getSettings, updateSettings, saveArticle, addJob } from "@/lib/store";
import { articleBlocks, articleCover } from "@/lib/articles";

// Menghasilkan + memublikasikan satu artikel long-form dari antrean topik harian.
export async function runDailyArticle() {
  const settings = getSettings();
  const daily = settings.dailyArticle || {};
  const topics = daily.topics || [];
  if (!topics.length) return { ok: false, error: "Antrean topik kosong" };

  // Rotasi topik: ambil paling depan, pindahkan ke belakang.
  const topic = topics[0];
  const rotated = [...topics.slice(1), topic];

  const gen = await generateArticle({ topic });
  const body = articleBlocks(gen);

  const record = saveArticle({
    title: gen.title || topic,
    excerpt: gen.excerpt || "",
    category: gen.category || "Panduan",
    readMinutes: gen.readMinutes || 6,
    body,
    keywords: gen.keywords || [topic],
    cover: articleCover(gen.category),
    status: "published",
  });

  updateSettings({ dailyArticle: { ...daily, topics: rotated, lastRun: new Date().toISOString() } });
  addJob({ type: "article", title: record.title, slug: record.slug, result: `/artikel/${record.slug}`, aiUsed: gen.aiUsed });

  return { ok: true, slug: record.slug, title: record.title, url: `/artikel/${record.slug}`, aiUsed: gen.aiUsed };
}
