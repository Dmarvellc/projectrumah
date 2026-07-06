"use client";

import { useState } from "react";
import { kprMonthly, formatFullPrice } from "@/lib/utils";
import { IconCalc } from "@/components/icons";

export default function KprCalculator({ price }) {
  const [dpPct, setDpPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(15);

  const dp = (price * dpPct) / 100;
  const principal = price - dp;
  const monthly = kprMonthly(principal, rate, years);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
      <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
        <IconCalc size={20} className="text-pine-600" /> Simulasi KPR
      </h3>
      <p className="mt-1 text-xs text-ink-faint">Estimasi cicilan bulanan (metode anuitas).</p>

      <div className="mt-5 space-y-5">
        <Range label={`Uang muka (${dpPct}%)`} value={dpPct} min={5} max={50} step={5} onChange={setDpPct} hint={formatFullPrice(dp)} />
        <Range label={`Bunga / tahun (${rate}%)`} value={rate} min={3} max={12} step={0.25} onChange={setRate} />
        <Range label={`Tenor (${years} tahun)`} value={years} min={5} max={30} step={1} onChange={setYears} />
      </div>

      <div className="mt-6 rounded-xl bg-pine-50 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-pine-700">
          Estimasi cicilan / bulan
        </div>
        <div className="mt-1 font-serif text-3xl font-bold text-pine-800">
          {formatFullPrice(Math.round(monthly))}
        </div>
        <div className="mt-1 text-xs text-ink-faint">
          Pinjaman pokok {formatFullPrice(principal)}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
        Estimasi kasar; belum termasuk asuransi, provisi, dan biaya lain. Bukan penawaran resmi.
      </p>
    </div>
  );
}

function Range({ label, value, min, max, step, onChange, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-pine-700"
      />
    </div>
  );
}
