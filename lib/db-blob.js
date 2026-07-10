// ============================================================
//  Persistensi database produksi via Vercel Blob.
//
//  Model: seluruh isi db (listing, leads, klien, tugas, dst.)
//  disimpan sebagai satu dokumen JSON di Blob. Cocok untuk
//  situs satu-admin: baca sekali saat cold start (lalu cache
//  di memori), tulis-tembus setiap mutasi. Bertahan melewati
//  redeploy — tidak ada lagi data hilang.
//
//  Aktif otomatis bila BLOB_READ_WRITE_TOKEN ada (production).
//  Lokal tetap memakai file content/db.json.
// ============================================================

import { put, list } from "@vercel/blob";

const KEY = "db/rumahplus-db.json";

export function blobDbEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Muat dokumen db dari Blob (dipanggil sekali per cold start).
export async function loadDbFromBlob() {
  try {
    const { blobs } = await list({ prefix: KEY, limit: 1 });
    if (!blobs.length) return null;
    // cache-bust: Blob dilayani CDN — pastikan versi terbaru
    const res = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("loadDbFromBlob gagal:", err?.message || err);
    return null;
  }
}

// Simpan dokumen db ke Blob (write-through; fire-and-wait).
export async function saveDbToBlob(db) {
  try {
    await put(KEY, JSON.stringify(db), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return true;
  } catch (err) {
    console.error("saveDbToBlob gagal:", err?.message || err);
    return false;
  }
}

// Simpan file materi (PPT/video) ke Blob → URL permanen.
export async function saveAssetToBlob(name, buf, contentType) {
  try {
    const { url } = await put(`assets/${name}`, buf, { access: "public", contentType, addRandomSuffix: false, allowOverwrite: true });
    return url;
  } catch (err) {
    console.error("saveAssetToBlob gagal:", err?.message || err);
    return null;
  }
}
