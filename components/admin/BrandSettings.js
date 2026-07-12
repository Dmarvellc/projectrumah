"use client";

import { useState } from "react";
import { IconCheck } from "@/components/icons";

export default function BrandSettings({ initial }) {
  const [brand, setBrand] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => {
    setBrand((b) => ({ ...b, [k]: v }));
    setSaved(false);
  };

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal");
      setBrand(json.brand);
      setSaved(true);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  const contactName = brand.agentName || brand.brandName;
  const contactPhone = brand.agentPhone || "—";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,520px)_1fr]">
      {/* FORM */}
      <div className="card space-y-6 p-8">
        <div>
          <span className="label">Nama merek (watermark)</span>
          <input value={brand.brandName} onChange={(e) => set("brandName", e.target.value)} className="field" placeholder="mis. Marvell Property" />
          <p className="mt-1.5 text-base font-semibold text-ink-faint">Muncul di PPT, brosur, video, dan cover — pengganti "RumahPlus".</p>
        </div>
        <div>
          <span className="label">Tagline (opsional)</span>
          <input value={brand.tagline} onChange={(e) => set("tagline", e.target.value)} className="field" placeholder="mis. Properti pilihan, dilayani sepenuh hati" />
        </div>

        <div className="h-px bg-ink/10" />

        <div>
          <span className="label">Nama agen</span>
          <input value={brand.agentName} onChange={(e) => set("agentName", e.target.value)} className="field" placeholder="mis. Budi Santoso" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label">Nomor telepon / WhatsApp</span>
            <input value={brand.agentPhone} onChange={(e) => set("agentPhone", e.target.value)} className="field" placeholder="0812-3456-7890" />
          </div>
          <div>
            <span className="label">Perusahaan (opsional)</span>
            <input value={brand.agentCompany} onChange={(e) => set("agentCompany", e.target.value)} className="field" placeholder="mis. Marvell Property" />
          </div>
        </div>
        <div>
          <span className="label">Email (opsional)</span>
          <input value={brand.agentEmail} onChange={(e) => set("agentEmail", e.target.value)} className="field" placeholder="agen@email.com" />
        </div>

        <button onClick={save} disabled={busy} className="btn-primary w-full py-4 text-lg disabled:opacity-60">
          {busy ? "Menyimpan…" : saved ? "Tersimpan ✓" : "Simpan"}
        </button>
        {error && <p className="text-base font-bold text-red-700">{error}</p>}
        <p className="text-base font-semibold text-ink-faint">
          Berlaku untuk listing & materi yang dibuat setelah ini. Listing lama tetap memakai data lamanya.
        </p>
      </div>

      {/* PRATINJAU */}
      <div className="space-y-5">
        <div className="text-lg font-extrabold text-ink">Pratinjau</div>

        {/* watermark */}
        <div className="overflow-hidden rounded-3xl bg-pine-900 p-8">
          <div className="text-3xl font-extrabold text-paper">{brand.brandName || "RumahPlus"}</div>
          {brand.tagline && <div className="mt-1 text-lg font-semibold text-pine-200">{brand.tagline}</div>}
        </div>

        {/* kartu kontak seperti di halaman properti */}
        <div className="card p-7">
          <div className="text-base font-bold text-ink-faint">Kartu kontak di halaman properti & materi</div>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-pine-100 text-2xl font-extrabold text-pine-700">
              {contactName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xl font-extrabold text-ink">
                {contactName}
                <IconCheck size={20} className="text-pine-600" />
              </div>
              {brand.agentCompany && <div className="text-base font-semibold text-ink-faint">{brand.agentCompany}</div>}
              <div className="text-lg font-bold text-pine-700">{contactPhone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
