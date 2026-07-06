"use client";

import { useState } from "react";
import { IconCheck } from "@/components/icons";

export default function InquiryForm({ propertySlug, propertyTitle }) {
  const [form, setForm] = useState({ name: "", phone: "", message: `Halo, saya tertarik dengan "${propertyTitle}". Mohon informasinya.` });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, propertySlug, propertyTitle }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Gagal mengirim");
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-pine-200 bg-pine-50 p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-pine-700 text-paper"><IconCheck size={22} /></span>
        <h3 className="mt-3 font-serif text-lg font-semibold text-ink">Terima kasih</h3>
        <p className="mt-1 text-sm text-ink-soft">Tim kami akan menghubungi Anda segera.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
      <h3 className="font-serif text-lg font-semibold text-ink">Tanya properti ini</h3>
      <p className="mt-1 text-xs text-ink-faint">Isi data, tim kami akan menghubungi Anda.</p>
      <div className="mt-4 space-y-3">
        <div>
          <span className="label">Nama</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="field" placeholder="Nama Anda" />
        </div>
        <div>
          <span className="label">Nomor telepon / WhatsApp</span>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required className="field" placeholder="08xx xxxx xxxx" />
        </div>
        <div>
          <span className="label">Pesan</span>
          <textarea value={form.message} onChange={(e) => set("message", e.target.value)} className="field min-h-[80px]" />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-4 w-full disabled:opacity-60">
        {busy ? "Mengirim…" : "Kirim inquiry"}
      </button>
    </form>
  );
}
