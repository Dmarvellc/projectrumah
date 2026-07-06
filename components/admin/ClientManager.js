"use client";

import { useState } from "react";
import Link from "next/link";
import { TYPE_LABELS } from "@/data";
import { formatPrice } from "@/lib/utils";
import { IconPlus, IconTrash, IconSearch } from "@/components/icons";

const STAGES = [
  { key: "prospek", label: "Prospek", prob: 0.1 },
  { key: "survei", label: "Survei", prob: 0.3 },
  { key: "nego", label: "Nego", prob: 0.6 },
  { key: "closing", label: "Closing", prob: 0.9 },
];
const PROB = Object.fromEntries(STAGES.map((s) => [s.key, s.prob]));
const COMMISSION = 0.025; // asumsi komisi 2,5% dari nilai transaksi

function fmtShort(n) {
  if (!n) return "Rp 0";
  if (n >= 1e9) return "Rp " + (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1).replace(".", ",") + " M";
  if (n >= 1e6) return "Rp " + Math.round(n / 1e6) + " Jt";
  return "Rp " + n.toLocaleString("id-ID");
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  need: "jual",
  prefType: "rumah",
  prefLocation: "",
  budget: "",
  notes: "",
};

export default function ClientManager({ initialClients = [] }) {
  const [clients, setClients] = useState(initialClients);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(initialClients.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState({}); // { [clientId]: [...] }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function call(method, body) {
    const res = await fetch("/api/admin/clients", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal");
    return json;
  }

  async function addClient(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const json = await call("POST", { client: form });
      setClients(json.clients);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function setStage(id, stage) {
    try {
      const json = await call("PATCH", { id, stage });
      setClients(json.clients);
    } catch (err) {
      setError(String(err.message || err));
    }
  }

  async function remove(id) {
    if (!confirm("Hapus klien ini?")) return;
    try {
      const json = await call("DELETE", { id });
      setClients(json.clients);
    } catch (err) {
      setError(String(err.message || err));
    }
  }

  async function match(id) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clients/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal");
      setMatches((m) => ({ ...m, [id]: json.matches }));
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  const active = clients.filter((c) => c.stage !== "batal");

  return (
    <div>
      {/* RINGKASAN PIPELINE */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        {STAGES.map((s) => (
          <div key={s.key} className="card p-6">
            <div className="text-5xl font-extrabold text-ink">{active.filter((c) => c.stage === s.key).length}</div>
            <div className="mt-2 text-lg font-bold text-ink-soft">{s.label}</div>
          </div>
        ))}
      </div>

      {/* PROYEKSI KOMISI — pipeline value tertimbang tahap */}
      {(() => {
        const pipelineValue = active.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
        const weightedComm = active.reduce((sum, c) => sum + (Number(c.budget) || 0) * COMMISSION * (PROB[c.stage] || 0), 0);
        const closingComm = active.filter((c) => c.stage === "closing").reduce((sum, c) => sum + (Number(c.budget) || 0) * COMMISSION, 0);
        if (pipelineValue === 0) return null;
        return (
          <div className="mt-6 grid gap-5 rounded-3xl bg-pine-800 p-8 text-paper sm:grid-cols-3">
            <div>
              <div className="text-lg font-bold text-pine-200">Nilai pipeline</div>
              <div className="mt-1 text-4xl font-extrabold">{fmtShort(pipelineValue)}</div>
              <div className="mt-1 text-base font-semibold text-paper/70">total budget klien aktif</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pine-200">Proyeksi komisi</div>
              <div className="mt-1 text-4xl font-extrabold">{fmtShort(Math.round(weightedComm))}</div>
              <div className="mt-1 text-base font-semibold text-paper/70">tertimbang peluang tiap tahap · {Math.round(COMMISSION * 1000) / 10}%</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pine-200">Dekat closing</div>
              <div className="mt-1 text-4xl font-extrabold">{fmtShort(Math.round(closingComm))}</div>
              <div className="mt-1 text-base font-semibold text-paper/70">komisi dari tahap closing</div>
            </div>
          </div>
        );
      })()}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-ink">Semua klien</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary py-3">
          <IconPlus size={20} /> {showForm ? "Tutup" : "Tambah klien"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={addClient} className="card mt-5 grid gap-4 p-8 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="label">Nama</span>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="field" placeholder="Nama klien" />
          </div>
          <div>
            <span className="label">Telepon / WA</span>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="field" placeholder="08xx" />
          </div>
          <div>
            <span className="label">Kebutuhan</span>
            <select value={form.need} onChange={(e) => set("need", e.target.value)} className="field">
              <option value="jual">Beli</option>
              <option value="sewa">Sewa</option>
            </select>
          </div>
          <div>
            <span className="label">Tipe dicari</span>
            <select value={form.prefType} onChange={(e) => set("prefType", e.target.value)} className="field">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Budget (Rp)</span>
            <input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} className="field" placeholder="1500000000" />
          </div>
          <div className="sm:col-span-2">
            <span className="label">Lokasi diinginkan</span>
            <input value={form.prefLocation} onChange={(e) => set("prefLocation", e.target.value)} className="field" placeholder="mis. BSD, Tangerang Selatan" />
          </div>
          <div className="sm:col-span-2">
            <span className="label">Catatan</span>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="field min-h-[90px]" placeholder="Preferensi lain, jadwal, hasil pembicaraan…" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary sm:col-span-2 disabled:opacity-60">
            {busy ? "Menyimpan…" : "Simpan klien"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-base font-bold text-red-700">{error}</p>}

      {/* DAFTAR */}
      {clients.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-xl font-extrabold text-ink">Belum ada klien</p>
          <p className="mt-2 text-lg text-ink-soft">Tambahkan klien pertama, atau konversi dari Leads.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-5">
          {clients.map((c) => (
            <li key={c.id} className="card p-7">
              <div className="flex flex-wrap items-start gap-5">
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-extrabold text-ink">{c.name}</div>
                  <div className="mt-1 text-base font-semibold text-ink-soft">
                    {c.phone || "—"} · {c.need === "sewa" ? "Sewa" : "Beli"} {TYPE_LABELS[c.prefType] || c.prefType}
                    {c.prefLocation ? ` di ${c.prefLocation}` : ""}
                    {c.budget > 0 ? ` · Budget ${formatPrice(Number(c.budget))}` : ""}
                  </div>
                  {c.notes && <p className="mt-2 text-base text-ink-soft">{c.notes}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={c.stage}
                    onChange={(e) => setStage(c.id, e.target.value)}
                    className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base font-bold text-ink outline-none focus:border-pine-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                    <option value="batal">Batal</option>
                  </select>
                  <button onClick={() => match(c.id)} disabled={busy} className="btn-outline px-4 py-2.5 text-base" title="Cocokkan dengan listing">
                    <IconSearch size={20} /> Cocokkan
                  </button>
                  <button onClick={() => remove(c.id)} className="text-ink-faint transition hover:text-red-700">
                    <IconTrash size={22} />
                  </button>
                </div>
              </div>

              {/* HASIL MATCHING */}
              {matches[c.id] && (
                <div className="mt-5 border-t border-ink/10 pt-5">
                  {matches[c.id].length === 0 ? (
                    <p className="text-base font-bold text-ink-faint">Belum ada listing yang cocok.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {matches[c.id].map((m) => (
                        <Link
                          key={m.slug}
                          href={`/properti/${m.slug}`}
                          target="_blank"
                          className="overflow-hidden rounded-2xl border-2 border-ink/10 transition hover:border-pine-500"
                        >
                          {m.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.image} alt="" className="h-32 w-full object-cover" />
                          )}
                          <div className="p-4">
                            <div className="line-clamp-1 text-base font-extrabold text-ink">{m.title}</div>
                            <div className="text-base font-bold text-pine-700">{formatPrice(m.price, m.listing, m.priceUnit)}</div>
                            {m.why?.length > 0 && (
                              <div className="mt-1 text-sm font-semibold text-ink-faint">{m.why.join(" · ")}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
