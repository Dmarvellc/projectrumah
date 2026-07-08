"use client";

import { IconPrint } from "@/components/icons";

// Tombol cetak/simpan-PDF (disembunyikan saat dicetak).
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary no-print py-3">
      <IconPrint size={20} /> Cetak / Simpan PDF
    </button>
  );
}
