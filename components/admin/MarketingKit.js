"use client";

import { useState } from "react";
import { IconMega, IconWand } from "@/components/icons";

export default function MarketingKit({ listings }) {
  const [slug, setSlug] = useState(listings[0]?.slug || "");
  const [busy, setBusy] = useState(false);
  const [kit, setKit] = useState(null);
  const [coverSvg, setCoverSvg] = useState("");
  const [error, setError] = useState("");

  const listing = listings.find((l) => l.slug === slug);

  async function generate() {
    if (!listing) return;
    setBusy(true); setError(""); setKit(null); setCoverSvg("");
    try {
      const [mkt, vis] = await Promise.all([
        fetch("/api/admin/pipeline/marketing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing }) }).then((r) => r.json()),
        fetch("/api/admin/pipeline/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing }) }).then((r) => r.json()),
      ]);
      setKit(mkt);
      setCoverSvg(vis.coverSvg || "");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  function downloadCover() {
    const blob = new Blob([coverSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cover.svg"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white p-5 shadow-card sm:flex-row sm:items-end">
        <div className="flex-1">
          <span className="label">Pilih listing</span>
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className="field">
            {listings.map((l) => <option key={l.slug} value={l.slug}>{l.title}</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={busy || !listing} className="btn-primary shrink-0 disabled:opacity-60">
          <IconWand size={17} /> {busy ? "Menyusun…" : "Buat materi"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {kit && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Block label="Caption Instagram" text={kit.instagram} />
            <Block label="Pesan WhatsApp" text={kit.whatsapp} />
            <Block label="Posting Facebook" text={kit.facebook} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Block label="Judul Iklan" text={kit.ad?.headline} />
              <Block label="Teks Iklan" text={kit.ad?.primary} />
            </div>
            <Block label="Subjek Email" text={kit.email?.subject} />
            <Block label="Isi Email" text={kit.email?.body} />
            {kit.hashtags?.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <span className="label mb-0">Hashtag</span>
                  <Copy text={kit.hashtags.map((h) => "#" + h).join(" ")} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {kit.hashtags.map((h) => <span key={h} className="chip py-0.5 text-[11px]">#{h}</span>)}
                </div>
              </div>
            )}
          </div>

          {coverSvg && (
            <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><IconMega size={16} className="text-pine-600" /> Cover sosial</div>
              <div className="overflow-hidden rounded-xl border border-ink/10" dangerouslySetInnerHTML={{ __html: coverSvg.replace('width="1200" height="1200"', 'width="100%"') }} />
              <button onClick={downloadCover} className="btn-outline mt-3 w-full py-2 text-xs">Unduh (.svg)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Block({ label, text }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <Copy text={text} />
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}

function Copy({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text || ""); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="text-xs font-semibold text-pine-700 hover:underline"
    >
      {done ? "Tersalin" : "Salin"}
    </button>
  );
}
