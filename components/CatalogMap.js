"use client";

import { useState } from "react";
import PropertyMap from "@/components/PropertyMap";
import { IconPin, IconList } from "@/components/icons";

// Toggle tampilan peta di halaman katalog. Marker = harga, klik → kartu properti.
export default function CatalogMap({ points }) {
  const [show, setShow] = useState(false);
  const usable = points.filter((p) => p.lat && p.lng);
  if (!usable.length) return null;

  return (
    <div className="mb-6">
      <button onClick={() => setShow((s) => !s)} className={show ? "btn-primary py-3" : "btn-outline py-3"}>
        {show ? <IconList size={20} /> : <IconPin size={20} />}
        {show ? "Tutup peta" : `Lihat di peta (${usable.length})`}
      </button>
      {show && (
        <div className="mt-4">
          <PropertyMap points={usable} height={520} />
        </div>
      )}
    </div>
  );
}
