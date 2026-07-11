"use client";

// Panel status penyimpanan — mengubah kondisi konfigurasi yang tak terlihat
// menjadi jelas: hijau (aman), merah (ada yang harus dilakukan + caranya).
import { useEffect, useState } from "react";
import { IconCheck, IconBolt } from "@/components/icons";

export default function StorageStatus() {
  const [info, setInfo] = useState(null); // { onVercel, blobConfigured }
  const [test, setTest] = useState(null); // null | 'busy' | { ok, error }

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ onVercel: false, blobConfigured: false }));
  }, []);

  async function runTest() {
    setTest("busy");
    try {
      const res = await fetch("/api/admin/storage", { method: "POST" });
      setTest(await res.json());
    } catch (err) {
      setTest({ ok: false, error: String(err?.message || err) });
    }
  }

  if (!info) return null;

  // Lokal tanpa Blob: file-based — tidak perlu apa-apa, tak usah berisik.
  if (!info.onVercel && !info.blobConfigured) return null;

  // MASALAH: di Vercel tapi Blob belum masuk deployment.
  if (info.onVercel && !info.blobConfigured) {
    return (
      <div className="mb-6 rounded-3xl border-2 border-red-300 bg-red-50 p-6">
        <div className="text-xl font-extrabold text-red-700">⚠ Penyimpanan permanen BELUM aktif</div>
        <p className="mt-2 text-lg font-semibold text-ink-soft">
          Foto upload & data baru akan hilang saat redeploy. Blob store sudah dibuat? Tinggal sambungkan:
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-lg font-bold text-ink">
          <li>Vercel → Storage → pilih store → tab <span className="text-pine-700">Connect Project</span> → pilih project ini</li>
          <li>Deployments → <span className="text-pine-700">Redeploy</span> (wajib — env baru hanya masuk saat deploy baru)</li>
        </ol>
        <p className="mt-3 text-base font-semibold text-ink-faint">
          Alternatif manual: Settings → Environment Variables → tambah <code className="rounded bg-ink/10 px-1.5">BLOB_READ_WRITE_TOKEN</code> dari halaman store → Redeploy.
        </p>
      </div>
    );
  }

  // Token ada → tawarkan tes nyata + hasil.
  return (
    <div className={`mb-6 rounded-3xl border-2 p-5 ${test && test !== "busy" ? (test.ok ? "border-pine-300 bg-pine-50" : "border-red-300 bg-red-50") : "border-ink/10 bg-white"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${test && test !== "busy" && test.ok ? "bg-pine-700 text-paper" : "bg-pine-50 text-pine-700"}`}>
            <IconCheck size={24} />
          </span>
          <div>
            <div className="text-lg font-extrabold text-ink">
              {test === "busy"
                ? "Menguji penyimpanan…"
                : test?.ok
                ? "Penyimpanan permanen AKTIF — foto & data aman"
                : test && !test.ok
                ? "Token terpasang tapi GAGAL dipakai"
                : "Blob terpasang — jalankan tes untuk memastikan"}
            </div>
            {test && test !== "busy" && !test.ok && (
              <div className="text-base font-semibold text-red-700">{test.error}</div>
            )}
          </div>
        </div>
        <button onClick={runTest} disabled={test === "busy"} className="btn-outline py-2.5 disabled:opacity-50">
          <IconBolt size={18} /> {test === "busy" ? "Menguji…" : "Tes penyimpanan"}
        </button>
      </div>
    </div>
  );
}
