"use client";

import { useState } from "react";

const IDEAS = [
  "Cara memilih lokasi rumah untuk investasi jangka panjang",
  "Untung rugi membeli apartemen vs rumah tapak",
  "Tips negosiasi harga properti agar dapat harga terbaik",
  "Memahami biaya tersembunyi saat membeli rumah",
];

export default function ArticleGenerator() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");

  async function generate(t) {
    const subject = (t ?? topic).trim();
    if (!subject) return;
    setLoading(true);
    setError("");
    setArticle(null);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: subject }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Gagal");
      setArticle(json);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
      <h2 className="font-serif text-xl font-semibold text-ink">Buat draf artikel</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Masukkan topik properti, sistem menyusun draf artikel untuk Anda sunting.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          className="field"
          placeholder="mis. Tips beli rumah pertama untuk milenial"
        />
        <button onClick={() => generate()} disabled={loading} className="btn-primary shrink-0 disabled:opacity-60">
          {loading ? "Menyusun…" : "Buat draf"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            onClick={() => {
              setTopic(idea);
              generate(idea);
            }}
            className="rounded-full border border-ink/10 bg-ink/[.02] px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-pine-300 hover:text-pine-700"
          >
            {idea}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {loading && (
        <div className="mt-6 animate-pulse space-y-3 rounded-2xl bg-ink/[.03] p-6">
          <div className="h-7 w-2/3 rounded bg-ink/10" />
          <div className="h-4 w-full rounded bg-ink/10" />
          <div className="h-4 w-full rounded bg-ink/10" />
          <div className="h-4 w-5/6 rounded bg-ink/10" />
        </div>
      )}

      {article && (
        <article className="mt-6 rounded-2xl bg-ink/[.02] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            <span className="eyebrow">{article.category}</span>
            <span>·</span>
            <span>{article.readMinutes} menit baca</span>
          </div>
          <h3 className="mt-3 font-serif text-2xl font-semibold text-ink">{article.title}</h3>
          {article.excerpt && <p className="mt-2 text-ink-soft">{article.excerpt}</p>}
          <div className="article-body mt-5">
            {article.body.map((b, i) =>
              typeof b === "string" ? <p key={i}>{b}</p>
              : b.t === "h2" ? <h2 key={i} className="mb-3 mt-8 font-serif text-xl font-bold text-ink">{b.text}</h2>
              : b.t === "img" ? null
              : <p key={i}>{b.text}</p>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
