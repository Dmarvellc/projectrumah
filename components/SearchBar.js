"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES, TYPE_LABELS } from "@/data";
import { IconSearch } from "@/components/icons";

export default function SearchBar() {
  const router = useRouter();
  const [listing, setListing] = useState("jual");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Semua Kota");
  const [type, setType] = useState("");

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("listing", listing);
    if (q) params.set("q", q);
    if (city && city !== "Semua Kota") params.set("city", city);
    if (type) params.set("type", type);
    router.push(`/properti?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-3 shadow-lift">
      <div className="mb-3 flex gap-1.5 px-1 pt-1">
        {[
          ["jual", "Beli"],
          ["sewa", "Sewa"],
        ].map(([l, lbl]) => (
          <button
            key={l}
            type="button"
            onClick={() => setListing(l)}
            className={`rounded-2xl px-7 py-2.5 text-lg font-extrabold transition ${
              listing === l ? "bg-pine-700 text-paper" : "text-ink-soft hover:bg-ink/[.04]"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="field border-transparent bg-ink/[.03]"
          placeholder="Cari lokasi, kawasan, atau kata kunci"
        />
        <select value={city} onChange={(e) => setCity(e.target.value)} className="field border-transparent bg-ink/[.03] md:w-44">
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="field border-transparent bg-ink/[.03] md:w-44">
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary md:px-8">
          <IconSearch size={20} /> Cari
        </button>
      </div>
    </form>
  );
}
