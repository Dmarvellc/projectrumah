"use client";

import { useEffect, useState } from "react";

// Di produksi TANPA database (Blob) tersambung, perubahan (buat/edit/hapus)
// tidak tersimpan permanen. Banner ini menjelaskannya + memandu perbaikan,
// dengan tombol tes nyata agar tak menebak-nebak.
export default function PersistenceBanner() {
  const [status, setStatus] = useState(null); // { onVercel, blobConfigured }
  const [test, setTest] = useState(null); // { ok, error } | "loading"

  useEffect(() => {
    fetch("/api/admin/storage").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  async function runTest() {
    setTest("loading");
    try {
      const r = await fetch("/api/admin/storage", { method: "POST" });
      setTest(await r.json());
    } catch (e) {
      setTest({ ok: false, error: String(e) });
    }
  }

  // Hanya tampil di produksi yang penyimpanannya belum aktif.
  if (!status || !status.onVercel || status.blobConfigured) return null;

  return (
    <div className="mb-6 rounded-3xl border-2 border-red-300 bg-red-50 p-6">
      <div className="text-xl font-extrabold text-red-800">⚠ Data belum tersimpan permanen</div>
      <p className="mt-2 text-lg font-semibold text-red-800/90">
        Database belum tersambung, jadi buat/edit/hapus akan hilang saat server berpindah.
        Aktifkan sekali (2 menit):
      </p>
      <ol className="mt-3 space-y-1.5 text-lg font-bold text-red-900">
        <li>1. Vercel → <span className="underline">Storage</span> → buka store <b>projectrumah-blob</b> → tab <b>.env.local</b> → salin nilai <b>BLOB_READ_WRITE_TOKEN</b></li>
        <li>2. Project <b>Settings → Environment Variables</b> → tambah <b>BLOB_READ_WRITE_TOKEN</b> = token tadi (scope Production) → Save</li>
        <li>3. <b>Deployments → Redeploy</b></li>
      </ol>
      <p className="mt-2 text-base font-semibold text-red-800/80">
        Cara manual ini melewati checkbox “Add a read-write token” yang sering terlewat saat Connect.
      </p>
      <button onClick={runTest} className="btn-outline mt-4 border-red-300 py-2.5 text-red-800">
        {test === "loading" ? "Menguji…" : "Tes penyimpanan"}
      </button>
      {test && test !== "loading" && (
        <p className={`mt-2 text-base font-extrabold ${test.ok ? "text-pine-700" : "text-red-700"}`}>
          {test.ok ? "✓ Database aktif! Muat ulang halaman." : `Belum aktif: ${test.error}`}
        </p>
      )}
    </div>
  );
}
