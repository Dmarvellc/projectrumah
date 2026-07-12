"use client";

import { useEffect, useState } from "react";

// Di produksi (Vercel) TANPA Blob, semua perubahan (buat/edit/hapus) tidak
// tersimpan permanen — hilang saat server berpindah instance. Banner ini
// menjelaskan itu dengan jujur supaya "edit/hapus tidak berfungsi" tidak
// membingungkan, dan menunjukkan cara memperbaikinya.
export default function PersistenceBanner() {
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then((s) => setWarn(Boolean(s?.onVercel) && !s?.blobConfigured))
      .catch(() => {});
  }, []);

  if (!warn) return null;
  return (
    <div className="mb-6 rounded-3xl border-2 border-red-300 bg-red-50 p-6">
      <div className="text-xl font-extrabold text-red-800">⚠ Perubahan belum tersimpan permanen</div>
      <p className="mt-2 text-lg font-semibold text-red-800/90">
        Penyimpanan produksi belum aktif, jadi buat/edit/hapus akan hilang saat server menyegarkan.
        Aktifkan sekali di Vercel: <span className="font-extrabold">Storage → Blob → Connect Project</span>,
        centang <span className="font-extrabold">“Add a read-write token”</span>, lalu <span className="font-extrabold">Redeploy</span>.
      </p>
    </div>
  );
}
