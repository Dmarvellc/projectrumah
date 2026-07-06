"use client";

import { useState } from "react";
import { TYPE_LABELS } from "@/data";
import { IconCheck } from "@/components/icons";

const MAX_IMAGES = 6;

export default function ListingGenerator() {
  const [details, setDetails] = useState({
    type: "rumah",
    listing: "jual",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    landSize: "",
    buildingSize: "",
    extra: "",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function set(k, v) {
    setDetails((d) => ({ ...d, [k]: v }));
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    const loaded = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              const base64 = String(dataUrl).split(",")[1];
              resolve({ url: dataUrl, media_type: file.type, data: base64 });
            };
            reader.readAsDataURL(file);
          })
      )
    );
    setImages((prev) => [...prev, ...loaded].slice(0, MAX_IMAGES));
  }

  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details,
          images: images.map(({ media_type, data }) => ({ media_type, data })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal");
      setResult(json);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* FORM */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-ink">1. Data & foto properti</h2>

        <div className="mt-4">
          <span className="label">Foto properti (maks {MAX_IMAGES})</span>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-pine-200 bg-pine-50/50 px-4 py-8 text-center transition hover:bg-pine-50">
            <span className="text-sm font-semibold text-pine-700">Klik untuk unggah foto</span>
            <span className="mt-1 text-xs text-ink-faint">JPG / PNG — dianalisis untuk menyusun deskripsi</span>
            <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
          </label>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-ink/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-xs text-paper"
                    aria-label="Hapus foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <span className="label">Tipe</span>
            <select value={details.type} onChange={(e) => set("type", e.target.value)} className="field">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Status</span>
            <select value={details.listing} onChange={(e) => set("listing", e.target.value)} className="field">
              <option value="jual">Dijual</option>
              <option value="sewa">Disewakan</option>
            </select>
          </div>
          <div className="col-span-2">
            <span className="label">Lokasi</span>
            <input value={details.location} onChange={(e) => set("location", e.target.value)} className="field" placeholder="mis. BSD City, Tangerang Selatan" />
          </div>
          <div className="col-span-2">
            <span className="label">Harga (Rp)</span>
            <input type="number" value={details.price} onChange={(e) => set("price", e.target.value)} className="field" placeholder="mis. 2450000000" />
          </div>
          <Num label="Kamar Tidur" k="bedrooms" details={details} set={set} />
          <Num label="Kamar Mandi" k="bathrooms" details={details} set={set} />
          <Num label="Luas Tanah (m²)" k="landSize" details={details} set={set} />
          <Num label="Luas Bangunan (m²)" k="buildingSize" details={details} set={set} />
          <div className="col-span-2">
            <span className="label">Catatan tambahan (opsional)</span>
            <textarea value={details.extra} onChange={(e) => set("extra", e.target.value)} className="field min-h-[72px]" placeholder="mis. baru renovasi, dekat sekolah, bebas banjir" />
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="btn-primary mt-5 w-full disabled:opacity-60">
          {loading ? "Menyusun draf…" : "Buat draf deskripsi"}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>

      {/* RESULT */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-ink">2. Hasil draf</h2>

        {!result && !loading && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 py-16 text-center text-ink-faint">
            <p className="max-w-xs text-sm">Draf deskripsi akan muncul di sini setelah Anda menekan tombol buat.</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-6 w-2/3 rounded bg-ink/5" />
            <div className="h-4 w-full rounded bg-ink/5" />
            <div className="h-4 w-full rounded bg-ink/5" />
            <div className="h-4 w-4/5 rounded bg-ink/5" />
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-5">
            <Field label="Judul" value={result.title} />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label mb-0">Deskripsi</span>
                <CopyBtn text={result.description} />
              </div>
              <div className="whitespace-pre-line rounded-xl bg-ink/[.03] p-4 text-sm leading-7 text-ink-soft">
                {result.description}
              </div>
            </div>

            {result.highlights?.length > 0 && (
              <div>
                <span className="label">Poin keunggulan</span>
                <ul className="space-y-1.5">
                  {result.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-pine-600" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.tags?.length > 0 && (
              <div>
                <span className="label">Label pencarian</span>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {result.seoTitle && <Field label="Judul SEO" value={result.seoTitle} mono />}
          </div>
        )}
      </div>
    </div>
  );
}

function Num({ label, k, details, set }) {
  return (
    <div>
      <span className="label">{label}</span>
      <input type="number" value={details[k]} onChange={(e) => set(k, e.target.value)} className="field" placeholder="0" />
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <CopyBtn text={value} />
      </div>
      <div className={`rounded-xl bg-ink/[.03] p-3 text-sm text-ink ${mono ? "font-mono text-xs" : "font-semibold"}`}>
        {value}
      </div>
    </div>
  );
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="text-xs font-semibold text-pine-700 hover:underline"
    >
      {done ? "Tersalin" : "Salin"}
    </button>
  );
}
