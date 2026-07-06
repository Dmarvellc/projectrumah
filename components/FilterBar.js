"use client";

import { useRouter, usePathname } from "next/navigation";
import { CITIES, TYPE_LABELS } from "@/data";

export default function FilterBar({ current }) {
  const router = useRouter();
  const pathname = usePathname();

  function update(patch) {
    const params = new URLSearchParams();
    const merged = { ...current, ...patch };
    Object.entries(merged).forEach(([k, v]) => {
      if (v != null && v !== "" && !(k === "city" && v === "Semua Kota")) {
        params.set(k, v);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
      <div>
        <span className="label">Status</span>
        <div className="flex gap-1.5">
          {[
            ["", "Semua"],
            ["jual", "Dijual"],
            ["sewa", "Disewa"],
          ].map(([val, lbl]) => (
            <button
              key={lbl}
              onClick={() => update({ listing: val })}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                (current.listing || "") === val
                  ? "bg-pine-700 text-paper"
                  : "bg-ink/[.04] text-ink-soft hover:bg-ink/[.08]"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Kata kunci</span>
        <input
          defaultValue={current.q || ""}
          onKeyDown={(e) => e.key === "Enter" && update({ q: e.target.value })}
          onBlur={(e) => e.target.value !== (current.q || "") && update({ q: e.target.value })}
          className="field"
          placeholder="lokasi / kata kunci"
        />
      </div>

      <div>
        <span className="label">Tipe Properti</span>
        <select value={current.type || ""} onChange={(e) => update({ type: e.target.value })} className="field">
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Kota</span>
        <select value={current.city || "Semua Kota"} onChange={(e) => update({ city: e.target.value })} className="field">
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Kamar Tidur (min)</span>
        <div className="flex gap-1.5">
          {["", "1", "2", "3", "4"].map((b) => (
            <button
              key={b || "any"}
              onClick={() => update({ beds: b })}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                (current.beds || "") === b
                  ? "bg-pine-700 text-paper"
                  : "bg-ink/[.04] text-ink-soft hover:bg-ink/[.08]"
              }`}
            >
              {b ? `${b}+` : "Semua"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push(pathname)}
        className="text-xs font-semibold text-ink-faint transition hover:text-pine-700"
      >
        Reset filter
      </button>
    </aside>
  );
}
