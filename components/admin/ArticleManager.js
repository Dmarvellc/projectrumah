"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconWand, IconArticle } from "@/components/icons";

export default function ArticleManager({ initialSettings }) {
  const router = useRouter();
  const daily = initialSettings || {};
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const [enabled, setEnabled] = useState(daily.enabled ?? true);
  const [topicsText, setTopicsText] = useState((daily.topics || []).join("\n"));

  async function generate() {
    if (!topic.trim()) return;
    setBusy("gen"); setMsg(""); setDraft(null);
    const res = await fetch("/api/admin/articles/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const j = await res.json();
    setBusy("");
    if (!res.ok) return setMsg(j.error || "Gagal");
    setDraft(j);
  }

  async function publish() {
    setBusy("pub");
    const res = await fetch("/api/admin/articles/publish", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article: draft }),
    });
    const j = await res.json();
    setBusy("");
    if (!res.ok) return setMsg(j.error || "Gagal");
    setDraft(null); setTopic(""); setMsg("Artikel dipublikasikan.");
    router.refresh();
  }

  async function runDaily() {
    setBusy("daily"); setMsg("");
    const res = await fetch("/api/admin/articles/run-daily", { method: "POST" });
    const j = await res.json();
    setBusy("");
    setMsg(res.ok ? `Artikel harian terbit: ${j.title}` : j.error || "Gagal");
    router.refresh();
  }

  async function saveSettings() {
    setBusy("save");
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyArticle: { enabled }, topicsText }),
    });
    setBusy(""); setMsg("Pengaturan disimpan.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* GENERATOR */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink"><IconArticle size={18} className="text-pine-600" /> Buat artikel manual</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} className="field" placeholder="Topik artikel" />
          <button onClick={generate} disabled={busy === "gen"} className="btn-primary shrink-0 disabled:opacity-60">
            <IconWand size={16} /> {busy === "gen" ? "Menyusun…" : "Buat draf"}
          </button>
        </div>

        {draft && (
          <div className="mt-4 rounded-xl bg-ink/[.03] p-4">
            <span className="eyebrow">{draft.category}</span>
            <h3 className="mt-1 font-serif text-lg font-semibold text-ink">{draft.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{draft.excerpt}</p>
            <p className="mt-2 line-clamp-3 text-sm text-ink-faint">
              {typeof draft.body?.[0] === "string" ? draft.body?.[0] : draft.body?.find((b) => b.t === "p")?.text}
            </p>
            <button onClick={publish} disabled={busy === "pub"} className="btn-primary mt-3 py-2 text-xs disabled:opacity-60">
              {busy === "pub" ? "Menerbitkan…" : "Publikasikan"}
            </button>
          </div>
        )}
      </div>

      {/* AUTOMATION */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-ink">Otomasi harian</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Satu artikel SEO terbit tiap hari dari antrean topik (rotasi otomatis).
        </p>

        <label className="mt-4 flex items-center gap-3 text-sm font-medium text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-pine-700" />
          Aktifkan otomasi harian
        </label>

        <div className="mt-4">
          <span className="label">Antrean topik (satu per baris)</span>
          <textarea value={topicsText} onChange={(e) => setTopicsText(e.target.value)} className="field min-h-[120px] font-mono text-xs" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={saveSettings} disabled={busy === "save"} className="btn-outline py-2 text-xs disabled:opacity-60">Simpan pengaturan</button>
          <button onClick={runDaily} disabled={busy === "daily"} className="btn-primary py-2 text-xs disabled:opacity-60">
            {busy === "daily" ? "Menjalankan…" : "Jalankan sekarang"}
          </button>
        </div>

        <p className="mt-4 rounded-lg bg-ink/[.03] p-3 text-xs text-ink-faint">
          Untuk otomatis harian di produksi: jadwalkan <code className="font-mono">GET /api/cron/daily-article</code>
          {" "}(mis. Vercel Cron) dengan header <code className="font-mono">Authorization: Bearer CRON_SECRET</code>.
        </p>
      </div>

      {msg && <p className="text-sm font-medium text-pine-700 lg:col-span-2">{msg}</p>}
    </div>
  );
}
