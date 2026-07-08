"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { IconWand, IconChat, IconCheck, IconCalendar } from "@/components/icons";

const TEMP = {
  hot: { label: "Panas", cls: "bg-red-600 text-white" },
  warm: { label: "Hangat", cls: "bg-sand-400 text-ink" },
  cold: { label: "Dingin", cls: "bg-ink/15 text-ink-soft" },
};

function waLink(phone, text) {
  const num = "62" + String(phone || "").replace(/\D/g, "").replace(/^0/, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export default function LeadCard({ lead }) {
  const router = useRouter();
  const [ai, setAi] = useState(lead.ai || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(-1);

  async function analyze() {
    setBusy(true);
    const res = await fetch("/api/admin/leads/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id }),
    });
    const json = await res.json();
    if (res.ok) setAi(json.ai);
    setBusy(false);
  }

  async function toggleStatus() {
    setBusy(true);
    await fetch("/api/admin/leads/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: lead.status === "new" ? "contacted" : "new" }),
    });
    setBusy(false);
    router.refresh();
  }

  const [taskMsg, setTaskMsg] = useState("");
  async function makeTask() {
    setBusy(true);
    const title = ai?.nextAction || `Follow-up ${lead.name}`;
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: {
          title: title.slice(0, 120),
          due: new Date().toISOString().slice(0, 10),
          kind: "followup",
          leadId: lead.id,
          listingSlug: lead.propertySlug || null,
          notes: lead.message || "",
        },
      }),
    });
    setBusy(false);
    if (res.ok) {
      setTaskMsg("Ditambahkan ke Agenda ✓");
      setTimeout(() => setTaskMsg(""), 2500);
    }
  }

  async function copy(text, i) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(-1), 1500);
    } catch {}
  }

  const t = ai ? TEMP[ai.temperature] || TEMP.cold : null;

  return (
    <div className={`rounded-3xl border p-7 shadow-card ${lead.status === "new" ? "border-sand-300 bg-sand-50" : "border-ink/10 bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-ink">{lead.name}</span>
            {ai && <span className={`rounded-xl px-3 py-1 text-base font-extrabold ${t.cls}`}>{t.label} · {ai.score}</span>}
          </div>
          <a href={`tel:${lead.phone}`} className="text-lg font-bold text-pine-700">{lead.phone}</a>
          {lead.message && <p className="mt-2 max-w-2xl text-lg text-ink-soft">{lead.message}</p>}
          {lead.propertyTitle && (
            <div className="mt-2 text-base font-semibold text-ink-faint">
              Terkait{" "}
              <Link href={`/properti/${lead.propertySlug}`} target="_blank" className="font-extrabold text-pine-700 hover:underline">{lead.propertyTitle}</Link>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-base font-semibold text-ink-faint">{formatDate(lead.createdAt)}</span>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={analyze} disabled={busy} className="btn-outline py-2 text-base disabled:opacity-50">
              <IconWand size={18} /> {busy ? "…" : ai ? "Analisis ulang" : "Analisis AI"}
            </button>
            <button onClick={makeTask} disabled={busy} className="btn-outline py-2 text-base disabled:opacity-50">
              <IconCalendar size={18} /> Jadikan tugas
            </button>
            <button onClick={toggleStatus} disabled={busy} className="btn-outline py-2 text-base disabled:opacity-50">
              {lead.status === "new" ? "Tandai dihubungi" : "Tandai baru"}
            </button>
          </div>
          {taskMsg && <span className="text-base font-extrabold text-pine-700">{taskMsg}</span>}
        </div>
      </div>

      {ai && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          {ai.reasoning && <p className="text-lg font-semibold text-ink-soft">{ai.reasoning}</p>}
          {ai.nextAction && (
            <div className="mt-3 flex items-start gap-3 rounded-2xl bg-pine-50 p-4">
              <IconCheck size={22} className="mt-0.5 shrink-0 text-pine-700" />
              <div>
                <div className="text-base font-extrabold text-pine-700">Langkah berikutnya</div>
                <div className="text-lg font-bold text-ink">{ai.nextAction}</div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="text-lg font-extrabold text-ink">Draf follow-up siap kirim</div>
            {ai.followUps?.map((f, i) => (
              <div key={i} className="rounded-2xl border-2 border-ink/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-extrabold text-pine-700">{f.when} · {f.channel}</span>
                  <div className="flex gap-2">
                    <button onClick={() => copy(f.message, i)} className="text-base font-extrabold text-ink-soft hover:text-ink">
                      {copied === i ? "Tersalin" : "Salin"}
                    </button>
                    <a href={waLink(lead.phone, f.message)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-base font-extrabold text-pine-700 hover:underline">
                      <IconChat size={18} /> Kirim
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-lg text-ink-soft">{f.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
