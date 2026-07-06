"use client";

import { useRouter, usePathname } from "next/navigation";

export default function SortSelect({ current }) {
  const router = useRouter();
  const pathname = usePathname();

  function change(sort) {
    const params = new URLSearchParams();
    Object.entries({ ...current, sort }).forEach(([k, v]) => {
      if (v != null && v !== "" && !(k === "city" && v === "Semua Kota")) params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current.sort || "newest"}
      onChange={(e) => change(e.target.value)}
      className="field w-auto py-2 text-sm"
    >
      <option value="newest">Terbaru</option>
      <option value="price-asc">Harga terendah</option>
      <option value="price-desc">Harga tertinggi</option>
    </select>
  );
}
