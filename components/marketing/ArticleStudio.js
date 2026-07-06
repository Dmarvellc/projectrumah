"use client";

import { useState } from "react";
import Link from "next/link";
import { IconWand, IconCheck, IconExternal, IconBolt } from "@/components/icons";

export default function ArticleStudio({ initialDaily }) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const daily = initialDaily || {};
  const [enabled, setEnabled] = useState(daily.enabled !== false);
  const [topicsText, setTopicsText] = useState((daily.topics || []).join("\n"));
  const [savedMsg, setSavedMsg] = useState("");

  async function call(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal");
    return json;
  }

  async function write() {
    if (!topic.trim()) return setError("Isi dulu topiknya.");
    setBusy("write");
    setError("");
    setResult(null);
    try {
      setResult(await call("/api/team/articles", { topic, audience }));
      setTopic("");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy("");
    }
  }

  async function saveDaily() {
    setBusy("save");
    setError("");
    try {
      await call("/api/team/daily", { enabled, topics: topicsText.split("\n").map((t) => t.trim()).filter(Boolean) });
      setSavedMsg("Tersimpan.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy("");
    }
  }

  async function runNow() {
    setBusy("run");
    setError("");
    setResult(null);
    try {
      const r = await call("/api/team/daily", { action: "run-now" });
      setResult({ ...r, fromQueue: true });
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      {/* TULIS SEKARANG */}
      <div className="card p-8">
        <h2 className="text-2xl font-extrabold text-ink">Tulis artikel sekarang</h2>
        <p className="mt-2 text-base text-ink-soft">
          Satu topik → artikel utuh 1200+ kata: bagian ber-heading, gambar editorial, SEO, langsung terbit.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <span className="label">Topik</span>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="field" placeholder="mis. Panduan KPR pertama untuk pasangan muda" />
          </div>
          <div>
            <span className="label">Target pembaca (opsional)</span>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} className="field" placeholder="mis. keluarga muda di Jabodetabek" />
          </div>
        </div>

        <button onClick={write} disabled={!!busy} className="btn-primary mt-6 w-full disabled:opacity-60">
          <IconWand size={20} /> {busy === "write" ? "Menulis artikel…" : "Tulis & terbitkan"}
        </button>
        {error && <p className="mt-3 text-base font-bold text-red-700">{error}</p>}

        {result && (
          <div className="mt-6 overflow-hidden rounded-3xl border-2 border-pine-300 bg-pine-50/50">
            {result.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.cover} alt="" className="h-44 w-full object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 text-base font-bold text-pine-700">
                <IconCheck size={20} /> Terbit{result.fromQueue ? " dari antrean" : ""}
              </div>
              <div className="mt-2 text-xl font-extrabold text-ink">{result.title}</div>
              {result.words ? (
                <div className="mt-1 text-base font-semibold text-ink-soft">
                  {result.words} kata · {result.readMinutes} menit baca
                </div>
              ) : null}
              <Link href={result.url} target="_blank" className="btn-primary mt-4 py-2.5">
                <IconExternal size={18} /> Baca artikel
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* OTOMASI HARIAN */}
      <div className="card p-8">
        <h2 className="text-2xl font-extrabold text-ink">Otomasi harian</h2>
        <p className="mt-2 text-base text-ink-soft">
          Satu artikel terbit otomatis setiap hari dari antrean topik. Topik dirotasi, tidak pernah habis.
        </p>

        <label className="mt-6 flex items-center gap-3 text-lg font-bold text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-pine-700" />
          Otomasi aktif
        </label>

        <div className="mt-5">
          <span className="label">Antrean topik — satu per baris</span>
          <textarea value={topicsText} onChange={(e) => setTopicsText(e.target.value)} className="field min-h-[200px]" />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button onClick={saveDaily} disabled={!!busy} className="btn-outline flex-1 disabled:opacity-60">
            {busy === "save" ? "Menyimpan…" : "Simpan"}
          </button>
          <button onClick={runNow} disabled={!!busy} className="btn-primary flex-1 disabled:opacity-60">
            <IconBolt size={20} /> {busy === "run" ? "Menulis…" : "Jalankan sekarang"}
          </button>
        </div>
        {savedMsg && <p className="mt-3 text-base font-bold text-pine-700">{savedMsg}</p>}
      </div>
    </div>
  );
}
