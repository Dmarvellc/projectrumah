"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPlus, IconTrash, IconCheck } from "@/components/icons";

const KINDS = {
  followup: "Follow-up",
  survei: "Survei",
  dokumen: "Dokumen",
  nego: "Nego",
  lainnya: "Lainnya",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDue = (d) => {
  if (!d) return "Tanpa tenggat";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return d;
  }
};

export default function AgendaManager({ initialTasks = [], clients = [], listings = [] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [form, setForm] = useState({ title: "", due: todayStr(), kind: "followup", clientId: "", listingSlug: "", notes: "" });
  const [showForm, setShowForm] = useState(initialTasks.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function call(method, body) {
    const res = await fetch("/api/admin/tasks", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal");
    return json;
  }

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const json = await call("POST", { task: form });
      setTasks(json.tasks);
      setForm({ title: "", due: todayStr(), kind: "followup", clientId: "", listingSlug: "", notes: "" });
      setShowForm(false);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(t) {
    const json = await call("PATCH", { id: t.id, done: !t.done }).catch(() => null);
    if (json) setTasks(json.tasks);
  }
  async function remove(id) {
    const json = await call("DELETE", { id }).catch(() => null);
    if (json) setTasks(json.tasks);
  }

  const open = tasks.filter((t) => !t.done);
  const today = todayStr();
  const overdue = open.filter((t) => t.due && t.due < today);
  const now = open.filter((t) => t.due === today);
  const upcoming = open.filter((t) => !t.due || t.due > today);
  const done = tasks.filter((t) => t.done).slice(0, 12);

  const clientName = (id) => clients.find((c) => c.id === id)?.name;
  const listingTitle = (slug) => listings.find((l) => l.slug === slug)?.title;

  return (
    <div>
      {/* RINGKASAN */}
      <div className="grid grid-cols-3 gap-5">
        <Stat label="Terlambat" value={overdue.length} tone={overdue.length > 0 ? "warn" : "flat"} />
        <Stat label="Hari ini" value={now.length} tone={now.length > 0 ? "good" : "flat"} />
        <Stat label="Mendatang" value={upcoming.length} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-ink">Semua tugas</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary py-3">
          <IconPlus size={20} /> {showForm ? "Tutup" : "Tambah tugas"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="card mt-5 grid gap-4 p-8 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="label">Tugas</span>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className="field" placeholder="mis. Telepon Pak Budi soal survei" />
          </div>
          <div>
            <span className="label">Tenggat</span>
            <input type="date" value={form.due} onChange={(e) => set("due", e.target.value)} className="field" />
          </div>
          <div>
            <span className="label">Jenis</span>
            <select value={form.kind} onChange={(e) => set("kind", e.target.value)} className="field">
              {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {clients.length > 0 && (
            <div>
              <span className="label">Klien (opsional)</span>
              <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)} className="field">
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {listings.length > 0 && (
            <div>
              <span className="label">Properti (opsional)</span>
              <select value={form.listingSlug} onChange={(e) => set("listingSlug", e.target.value)} className="field">
                <option value="">—</option>
                {listings.map((l) => <option key={l.slug} value={l.slug}>{l.title}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <span className="label">Catatan</span>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="field min-h-[70px]" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary sm:col-span-2 disabled:opacity-60">
            {busy ? "Menyimpan…" : "Simpan tugas"}
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-base font-bold text-red-700">{error}</p>}

      {tasks.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-xl font-extrabold text-ink">Belum ada tugas</p>
          <p className="mt-2 text-lg text-ink-soft">Tambahkan tugas pertama, atau buat dari tombol "Jadikan tugas" di Leads.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <Group title="Terlambat" tone="warn" items={overdue} {...{ toggle, remove, clientName, listingTitle }} />
          <Group title="Hari ini" tone="good" items={now} {...{ toggle, remove, clientName, listingTitle }} />
          <Group title="Mendatang" items={upcoming} {...{ toggle, remove, clientName, listingTitle }} />
          {done.length > 0 && <Group title="Selesai" items={done} muted {...{ toggle, remove, clientName, listingTitle }} />}
        </div>
      )}
    </div>
  );
}

function Group({ title, items, tone, muted, toggle, remove, clientName, listingTitle }) {
  if (!items.length) return null;
  const dot = tone === "warn" ? "bg-red-600" : tone === "good" ? "bg-pine-600" : "bg-ink/30";
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`h-3 w-3 rounded-full ${dot}`} />
        <h3 className="text-xl font-extrabold text-ink">{title}</h3>
        <span className="text-lg font-bold text-ink-faint">{items.length}</span>
      </div>
      <ul className="space-y-3">
        {items.map((t) => (
          <li key={t.id} className={`flex items-start gap-4 rounded-3xl border border-ink/10 bg-white p-5 shadow-card ${muted ? "opacity-60" : ""}`}>
            <button onClick={() => toggle(t)} title={t.done ? "Batalkan" : "Selesai"} className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 ${t.done ? "border-pine-700 bg-pine-700 text-paper" : "border-ink/25 text-transparent hover:border-pine-500"}`}>
              <IconCheck size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <div className={`text-lg font-bold text-ink ${t.done ? "line-through" : ""}`}>{t.title}</div>
              <div className="mt-1 text-base font-semibold text-ink-faint">
                {KINDS_LABEL(t.kind)} · {fmtDue(t.due)}
                {clientName(t.clientId) ? ` · ${clientName(t.clientId)}` : ""}
              </div>
              {t.listingSlug && listingTitle(t.listingSlug) && (
                <Link href={`/properti/${t.listingSlug}`} target="_blank" className="text-base font-extrabold text-pine-700 hover:underline">
                  {listingTitle(t.listingSlug)}
                </Link>
              )}
              {t.notes && <p className="mt-1 text-base text-ink-soft">{t.notes}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-ink-faint transition hover:text-red-700">
              <IconTrash size={20} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KINDS_LABEL(k) {
  return { followup: "Follow-up", survei: "Survei", dokumen: "Dokumen", nego: "Nego", lainnya: "Lainnya" }[k] || k;
}

function Stat({ label, value, tone = "flat" }) {
  const cls = tone === "warn" ? "border-red-300 bg-red-50" : tone === "good" ? "border-pine-300 bg-pine-50" : "border-ink/10 bg-white";
  const num = tone === "warn" ? "text-red-600" : tone === "good" ? "text-pine-700" : "text-ink";
  return (
    <div className={`rounded-3xl border p-6 shadow-card ${cls}`}>
      <div className={`text-5xl font-extrabold ${num}`}>{value}</div>
      <div className="mt-1 text-lg font-bold text-ink-soft">{label}</div>
    </div>
  );
}
