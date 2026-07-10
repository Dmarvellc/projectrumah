"use client";

import { useState } from "react";
import Link from "next/link";
import { IconBolt, IconCheck, IconSlide, IconExternal, IconTrash, IconPlus, IconMega, IconStar, IconClose } from "@/components/icons";

function scaleToDataUrl(img, maxDim, quality) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

// Dua versi: 'data' (medium, galeri) & 'analysisData' (kecil, vision AI).
function compressFile(file) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const medium = scaleToDataUrl(img, 1200, 0.72);
      const small = scaleToDataUrl(img, 768, 0.55);
      resolve({
        url: medium,
        media_type: "image/jpeg",
        data: medium.split(",")[1],
        analysisData: small.split(",")[1],
      });
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

const EXAMPLE = `Dijual rumah 2 lantai di Graha Raya, Tangerang Selatan
Harga 1,85 M nego
LT 105 / LB 140, 3 KT, 2 KM, carport 1
SHM, bebas banjir, dekat pintu tol dan sekolah
---
Disewakan apartemen studio full furnished daerah Kemang, Jakarta Selatan
Harga 6,5 juta per bulan
LB 28 m2, 1 KT 1 KM, strata, akses MRT`;

export default function AutopilotStudio({ initialQueue = [] }) {
  const [specs, setSpecs] = useState("");
  const [images, setImages] = useState([]);
  const [publish, setPublish] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [running, setRunning] = useState(false);
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState("");

  const [queue, setQueue] = useState(initialQueue);
  const [queueBusy, setQueueBusy] = useState(false);

  async function onFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, 12 - images.length);
    const loaded = (await Promise.all(files.map(compressFile))).filter(Boolean);
    setImages((prev) => [...prev, ...loaded].slice(0, 12));
    e.target.value = "";
  }
  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function call(url, opts) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    // Respons bisa non-JSON (mis. 413 "Request Entity Too Large").
    const raw = await res.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      if (res.status === 413 || /too large|request entity/i.test(raw)) {
        throw new Error("Foto terlalu besar/banyak. Kurangi jumlah foto (coba ≤ 6) lalu jalankan lagi.");
      }
      throw new Error(`Server bermasalah (${res.status}). Coba lagi.`);
    }
    if (!res.ok) throw new Error(json.error || "Gagal");
    return json;
  }

  async function run() {
    if (!specs.trim()) return setError("Tempel dulu spesifikasinya.");
    setRunning(true);
    setError("");
    setBatch(null);
    try {
      // Unggah galeri berbatch (≤3/req) → URL; kirim hanya URL + versi analisis
      // kecil ke server. Tak ada payload besar → bebas 413.
      let galleryUrls = [];
      for (let i = 0; i < images.length; i += 3) {
        const batch = images.slice(i, i + 3).map(({ media_type, data }) => ({ media_type, data }));
        const up = await call("/api/admin/upload", { method: "POST", body: JSON.stringify({ images: batch }) });
        galleryUrls.push(...(up.urls || []));
      }
      const result = await call("/api/admin/autopilot/run", {
        method: "POST",
        body: JSON.stringify({
          specs,
          publish,
          marketing,
          galleryUrls,
          images: images.slice(0, 6).map(({ media_type, analysisData }) => ({ media_type, data: analysisData })),
        }),
      });
      setBatch(result);
      setImages([]);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setRunning(false);
    }
  }

  async function addQueue() {
    if (!specs.trim()) return setError("Tempel dulu spesifikasinya.");
    setQueueBusy(true);
    setError("");
    try {
      // Setiap blok "---" jadi satu item antrean tersendiri.
      const blocks = specs.split(/\n\s*-{3,}\s*\n/).map((s) => s.trim()).filter(Boolean);
      let latest = queue;
      for (const b of blocks) {
        const json = await call("/api/admin/autopilot/queue", { method: "POST", body: JSON.stringify({ spec: b }) });
        latest = json.queue;
      }
      setQueue(latest);
      setSpecs("");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setQueueBusy(false);
    }
  }

  async function removeQueue(id) {
    setQueueBusy(true);
    try {
      const json = await call("/api/admin/autopilot/queue", { method: "DELETE", body: JSON.stringify({ id }) });
      setQueue(json.queue);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setQueueBusy(false);
    }
  }

  async function runQueueNext() {
    setQueueBusy(true);
    setError("");
    try {
      const result = await call("/api/admin/autopilot/queue", { method: "POST", body: JSON.stringify({ action: "run-next" }) });
      setQueue((q) => q.slice(1));
      setBatch({ total: 1, succeeded: 1, results: [result] });
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setQueueBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,480px)_1fr]">
      {/* INPUT */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
          <h2 className="font-serif text-lg font-semibold text-ink">Spesifikasi mentah</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Tempel teks bebas — broadcast WA, catatan survei, apa pun. Pisahkan beberapa properti dengan baris <code className="rounded bg-ink/5 px-1">---</code>.
          </p>

          <textarea
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            className="field mt-4 min-h-[220px] font-mono text-[13px]"
            placeholder={EXAMPLE}
          />
          <button onClick={() => setSpecs(EXAMPLE)} className="mt-1 text-base font-bold text-pine-700 hover:underline">
            Isi contoh
          </button>

          {/* UPLOAD FOTO */}
          <div className="mt-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pine-300 bg-pine-50/60 px-6 py-6 text-center transition hover:bg-pine-50">
              <IconStar size={26} className="text-pine-700" />
              <span className="mt-2 text-lg font-extrabold text-pine-700">Unggah foto properti (maks 12)</span>
              <span className="text-base font-semibold text-ink-faint">AI memilih cover terbaik & menulis caption — foto Anda yang dipakai</span>
              <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
            </label>
            {images.length > 0 && (
              <>
                <div className="mt-3 grid grid-cols-4 gap-2.5">
                  {images.map((img, i) => (
                    <div key={i} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute right-1.5 top-1.5 hidden rounded-full bg-ink/80 p-1 text-paper group-hover:block">
                        <IconClose size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-base font-bold text-pine-700">
                  {images.length} foto — semua teks diperlakukan sebagai satu properti.
                </p>
              </>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="h-4 w-4 accent-pine-700" />
              <span className="text-ink-soft">Langsung publikasikan (nonaktifkan untuk simpan sebagai draf)</span>
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4 accent-pine-700" />
              <span className="text-ink-soft">Sekalian buat materi marketing (IG, WA, iklan, email)</span>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button onClick={run} disabled={running || queueBusy} className="btn-primary flex-1 disabled:opacity-60">
              <IconBolt size={18} /> {running ? "Otomasi berjalan…" : "Jalankan sekarang"}
            </button>
            <button onClick={addQueue} disabled={running || queueBusy || images.length > 0} title={images.length ? "Antrean tidak menyimpan foto — pakai Jalankan sekarang" : ""} className="btn-outline flex-1 disabled:opacity-40">
              <IconPlus size={18} /> Masukkan antrean
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>

        {/* ANTREAN */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">Antrean otomasi</h2>
              <p className="mt-1 text-sm text-ink-faint">
                Diproses otomatis satu per satu oleh cron harian (<code className="rounded bg-ink/5 px-1">/api/cron/autopilot</code>), atau proses manual di sini.
              </p>
            </div>
            <span className="shrink-0 text-2xl font-extrabold text-pine-700">{queue.length}</span>
          </div>

          {queue.length > 0 ? (
            <>
              <ul className="mt-4 space-y-2">
                {queue.map((q, i) => (
                  <li key={q.id} className="flex items-start gap-3 rounded-xl border border-ink/10 bg-paper/60 p-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/10 text-xs font-bold text-ink-soft">{i + 1}</span>
                    <p className="min-w-0 flex-1 whitespace-pre-line text-xs text-ink-soft line-clamp-3">{q.spec}</p>
                    <button onClick={() => removeQueue(q.id)} disabled={queueBusy} title="Hapus dari antrean" className="text-ink-faint transition hover:text-red-700">
                      <IconTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <button onClick={runQueueNext} disabled={queueBusy || running} className="btn-outline mt-4 w-full py-2 text-sm disabled:opacity-60">
                <IconBolt size={16} /> {queueBusy ? "Memproses…" : "Proses item terdepan sekarang"}
              </button>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-paper/60 p-4 text-center text-sm text-ink-faint">Antrean kosong.</p>
          )}
        </div>
      </div>

      {/* HASIL */}
      <div className="space-y-4">
        {!batch && !running && (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-10 text-center">
            <IconBolt size={28} className="mx-auto text-ink-faint" />
            <p className="mt-3 font-serif text-lg font-semibold text-ink">Hasil otomasi tampil di sini</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-faint">
              Setiap spesifikasi diproses penuh: parsing data → konten AI → aset visual → materi marketing → halaman terbit → deck PPT siap unduh.
            </p>
          </div>
        )}

        {running && (
          <div className="rounded-2xl border border-sand-300 bg-sand-50 p-6 text-sm font-semibold text-ink-soft">
            Otomasi berjalan… memproses spesifikasi menjadi listing, marketing & PPT.
          </div>
        )}

        {batch && (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <IconCheck size={16} className="text-pine-700" />
              {batch.succeeded}/{batch.total} spesifikasi berhasil diproses
            </div>
            {batch.results.map((r, i) => (
              <ResultCard key={i} index={i + 1} r={r} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ResultCard({ index, r }) {
  const [showMkt, setShowMkt] = useState(false);

  if (!r.ok) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-card">
        <div className="font-semibold text-red-800">Spesifikasi #{index} gagal</div>
        <p className="mt-1 text-sm text-red-700">{r.error}</p>
        {r.spec && <p className="mt-2 text-xs text-ink-faint">“{r.spec}…”</p>}
      </div>
    );
  }

  const l = r.listing || {};
  return (
    <div className="rounded-2xl border border-pine-300 bg-pine-50/40 p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pine-700 text-paper">
          <IconCheck size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base font-semibold text-ink">{r.title}</div>
          <div className="mt-0.5 text-xs text-ink-faint">
            {l.location || "—"} · {r.status === "published" ? "Terbit" : "Draf"} · {r.aiUsed ? "AI" : "Offline"}
          </div>
        </div>
      </div>

      {r.warning && (
        <div className="mt-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-base font-bold text-red-700">
          ⚠ {r.warning}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-white/70 p-3 text-xs text-ink-soft sm:grid-cols-4">
        <Spec k="KT" v={l.bedrooms} />
        <Spec k="KM" v={l.bathrooms} />
        <Spec k="LT" v={l.landSize ? `${l.landSize} m²` : null} />
        <Spec k="LB" v={l.buildingSize ? `${l.buildingSize} m²` : null} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {r.status === "published" && (
          <Link href={r.url} target="_blank" className="btn-primary py-2 text-xs">
            <IconExternal size={15} /> Lihat halaman
          </Link>
        )}
        <a href={r.pptUrl} className="btn-outline py-2 text-xs">
          <IconSlide size={15} /> Unduh PPT
        </a>
        {r.marketing && (
          <button onClick={() => setShowMkt((s) => !s)} className="btn-outline py-2 text-xs">
            <IconMega size={15} /> {showMkt ? "Tutup marketing" : "Lihat marketing"}
          </button>
        )}
      </div>

      {showMkt && r.marketing && (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Snippet label="Instagram" text={r.marketing.instagram} />
          <Snippet label="WhatsApp" text={r.marketing.whatsapp} />
          <Snippet label="Iklan" text={`${r.marketing.ad?.headline} — ${r.marketing.ad?.primary}`} />
          <Snippet label="Email" text={`${r.marketing.email?.subject}\n${r.marketing.email?.body || ""}`} />
        </div>
      )}
    </div>
  );
}

function Spec({ k, v }) {
  return (
    <div>
      <span className="font-semibold text-ink-faint">{k}:</span> {v || "—"}
    </div>
  );
}

function Snippet({ label, text }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {}
  }
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
        <button onClick={copy} className="text-[11px] font-semibold text-pine-700 hover:underline">Salin</button>
      </div>
      <p className="mt-1 whitespace-pre-line text-xs text-ink-soft line-clamp-4">{text}</p>
    </div>
  );
}
