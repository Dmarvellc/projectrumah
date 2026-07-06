"use client";

import { useState } from "react";
import { TYPE_LABELS } from "@/data";
import { formatPrice } from "@/lib/utils";
import { IconWand, IconCheck, IconArea, IconPin } from "@/components/icons";

const fmtRp = (n) => (n ? "Rp " + Number(n).toLocaleString("id-ID") : "-");

export default function CmaStudio({ listings = [] }) {
  const [mode, setMode] = useState(listings.length ? "listing" : "manual");
  const [slug, setSlug] = useState(listings[0]?.slug || "");
  const [subject, setSubject] = useState({
    type: "rumah", listing: "jual", cluster: "", location: "", city: "",
    landSize: "", buildingSize: "", bedrooms: "", price: "",
  });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const set = (k, v) => setSubject((s) => ({ ...s, [k]: v }));

  async function run() {
    setBusy(true);
    setError("");
    setData(null);
    try {
      const payload = mode === "listing" ? { slug } : { subject: { ...subject, city: subject.city || subject.location.split(",").pop()?.trim() } };
      const res = await fetch("/api/admin/cma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal");
      setData(json);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  const a = data?.analysis;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,420px)_1fr]">
      {/* INPUT */}
      <div className="card space-y-5 p-7">
        <div className="flex gap-2">
          {listings.length > 0 && (
            <button onClick={() => setMode("listing")} className={mode === "listing" ? "btn-primary flex-1 py-2.5" : "btn-outline flex-1 py-2.5"}>Dari listing</button>
          )}
          <button onClick={() => setMode("manual")} className={mode === "manual" ? "btn-primary flex-1 py-2.5" : "btn-outline flex-1 py-2.5"}>Input manual</button>
        </div>

        {mode === "listing" ? (
          <div>
            <span className="label">Pilih properti</span>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="field">
              {listings.map((l) => (
                <option key={l.slug} value={l.slug}>{l.title}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="label">Tipe</span>
                <select value={subject.type} onChange={(e) => set("type", e.target.value)} className="field">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <span className="label">Status</span>
                <select value={subject.listing} onChange={(e) => set("listing", e.target.value)} className="field">
                  <option value="jual">Dijual</option>
                  <option value="sewa">Disewakan</option>
                </select>
              </div>
            </div>
            <div>
              <span className="label">Kawasan / Kota</span>
              <input value={subject.location} onChange={(e) => set("location", e.target.value)} className="field" placeholder="mis. Alam Sutera, Tangerang Selatan" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><span className="label">LT m²</span><input inputMode="numeric" value={subject.landSize} onChange={(e) => set("landSize", e.target.value.replace(/\D/g, ""))} className="field" placeholder="0" /></div>
              <div><span className="label">LB m²</span><input inputMode="numeric" value={subject.buildingSize} onChange={(e) => set("buildingSize", e.target.value.replace(/\D/g, ""))} className="field" placeholder="0" /></div>
              <div><span className="label">K. Tidur</span><input inputMode="numeric" value={subject.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/\D/g, ""))} className="field" placeholder="0" /></div>
            </div>
            <div>
              <span className="label">Harga diminta (opsional)</span>
              <input inputMode="numeric" value={subject.price ? Number(subject.price).toLocaleString("id-ID") : ""} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} className="field" placeholder="2.500.000.000" />
            </div>
          </div>
        )}

        <button onClick={run} disabled={busy} className="btn-primary w-full py-4 text-lg disabled:opacity-60">
          <IconWand size={22} /> {busy ? "Menganalisis pasar…" : "Analisis harga (CMA)"}
        </button>
        {error && <p className="text-base font-bold text-red-700">{error}</p>}
      </div>

      {/* HASIL */}
      <div className="space-y-6">
        {!data && !busy && (
          <div className="card p-10 text-center">
            <IconArea size={30} className="mx-auto text-ink-faint" />
            <p className="mt-3 text-xl font-extrabold text-ink">Analisis harga & posisi pasar</p>
            <p className="mx-auto mt-2 max-w-md text-lg text-ink-soft">
              Bandingkan properti dengan pembanding sekelas, dapatkan rentang harga wajar, ruang nego, estimasi lama terjual, dan argumen untuk memenangkan mandat jual.
            </p>
          </div>
        )}
        {busy && <div className="card p-8 text-lg font-bold text-ink-soft">Menghitung pembanding & menilai posisi harga…</div>}

        {data && (
          <>
            {/* RENTANG HARGA WAJAR */}
            <div className="rounded-3xl bg-pine-800 p-8 text-paper">
              <div className="text-lg font-bold text-pine-200">Estimasi harga wajar</div>
              <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
                <div className="text-5xl font-extrabold">{fmtRp(data.fair?.mid)}</div>
                <div className="pb-1 text-lg font-bold text-paper/80">rentang {fmtRp(data.fair?.low)} – {fmtRp(data.fair?.high)}</div>
              </div>
              {a?.recommendedList && (
                <div className="mt-4 rounded-2xl bg-pine-900/60 p-5">
                  <div className="text-base font-bold text-pine-200">Harga listing disarankan</div>
                  <div className="text-2xl font-extrabold">{fmtRp(a.recommendedList.low)} – {fmtRp(a.recommendedList.high)}</div>
                  {a.recommendedList.note && <p className="mt-1 text-base font-semibold text-paper/80">{a.recommendedList.note}</p>}
                </div>
              )}
            </div>

            {/* METRIK */}
            <div className="grid gap-5 sm:grid-cols-3">
              <Metric label="Posisi vs median" value={data.vsMedian == null ? "—" : `${data.vsMedian > 0 ? "+" : ""}${data.vsMedian}%`} tone={data.vsMedian > 8 ? "warn" : data.vsMedian < -8 ? "good" : "flat"} />
              <Metric label="Ruang nego" value={a?.negotiation?.roomPercent != null ? `${a.negotiation.roomPercent}%` : "—"} />
              <Metric label="Estimasi terjual" value={a?.estDaysToSell?.days ? `${a.estDaysToSell.days} hari` : "—"} />
            </div>

            {a?.verdict && (
              <div className="card p-7">
                <h3 className="text-xl font-extrabold text-ink">Kesimpulan</h3>
                <p className="mt-2 text-lg font-semibold text-ink-soft">{a.verdict}</p>
                {a.pricePerSqm && <p className="mt-3 text-base font-semibold text-ink-faint">{a.pricePerSqm}</p>}
              </div>
            )}

            {/* TALKING POINTS MANDAT */}
            {a?.mandateTalkingPoints?.length > 0 && (
              <div className="card p-7">
                <h3 className="text-xl font-extrabold text-ink">Argumen memenangkan mandat</h3>
                <ul className="mt-3 space-y-2.5">
                  {a.mandateTalkingPoints.map((t) => (
                    <li key={t} className="flex gap-3 text-lg font-semibold text-ink-soft">
                      <IconCheck size={22} className="mt-0.5 shrink-0 text-pine-600" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {a?.negotiation?.strategy && (
                <div className="card p-7">
                  <h3 className="text-xl font-extrabold text-ink">Strategi nego</h3>
                  <p className="mt-2 text-base font-semibold text-ink-soft">{a.negotiation.strategy}</p>
                </div>
              )}
              {a?.risks?.length > 0 && (
                <div className="card p-7">
                  <h3 className="text-xl font-extrabold text-ink">Risiko & jawaban</h3>
                  <ul className="mt-2 space-y-2 text-base font-semibold text-ink-soft">
                    {a.risks.map((r) => <li key={r}>• {r}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* PEMBANDING */}
            <div className="card p-7">
              <h3 className="text-xl font-extrabold text-ink">Pembanding ({data.rows?.length || 0})</h3>
              {data.rows?.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-ink/10 text-base font-extrabold text-ink-faint">
                        <th className="py-2 pr-4">Properti</th>
                        <th className="py-2 pr-4">Harga</th>
                        <th className="py-2 pr-4">Luas</th>
                        <th className="py-2 text-right">Rp / m²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {data.rows.map((r) => (
                        <tr key={r.slug}>
                          <td className="py-3 pr-4">
                            <div className="text-base font-bold text-ink">{r.title}</div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-ink-faint"><IconPin size={14} /> {r.location}</div>
                          </td>
                          <td className="py-3 pr-4 text-base font-bold text-ink">{formatPrice(r.price, r.listing, r.priceUnit)}</td>
                          <td className="py-3 pr-4 text-base font-semibold text-ink-soft">{r.area} m²</td>
                          <td className="py-3 text-right text-base font-extrabold text-pine-700">{fmtRp(r.ppsqm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base font-bold text-ink-soft">
                    <span>Min <span className="text-ink">{fmtRp(data.stats.minPpsqm)}</span></span>
                    <span>Median <span className="text-pine-700">{fmtRp(data.stats.medianPpsqm)}</span></span>
                    <span>Max <span className="text-ink">{fmtRp(data.stats.maxPpsqm)}</span></span>
                    <span className="text-ink-faint">semua per m²</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-lg font-semibold text-ink-faint">Belum ada pembanding sekelas di katalog. Estimasi memakai pengetahuan kawasan AI — tambah listing area untuk akurasi lebih tinggi.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "flat" }) {
  const color = tone === "good" ? "text-pine-700" : tone === "warn" ? "text-sand-600" : "text-ink";
  return (
    <div className="card p-6">
      <div className={`text-4xl font-extrabold ${color}`}>{value}</div>
      <div className="mt-1 text-lg font-bold text-ink-soft">{label}</div>
    </div>
  );
}
