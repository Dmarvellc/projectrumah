// ============================================================
//  RumahPlus Autopilot — Sistem otomasi milik pemilik situs
//
//  Satu input: spesifikasi mentah (teks bebas / broadcast WA).
//  Satu output: listing terparse → konten AI → aset visual →
//  materi marketing → halaman terbit → deck PPT siap unduh.
//
//  Bekerja dengan Claude bila ANTHROPIC_API_KEY tersedia;
//  tanpa API key memakai parser & generator offline.
// ============================================================

import { TYPE_LABELS } from "@/data";
import { aiEnabled, ask, parseJson, generateListing, generateMarketing, generateLocationInsight } from "@/lib/ai";
import { suggestImages, buildCoverSvg } from "@/lib/images";
import { saveListing, addJob, getSettings, updateSettings } from "@/lib/store";
import { geocode } from "@/lib/geo";
import { saveImagesToUploads } from "@/lib/uploads";

// ------------------------------------------------------------
//  1) SPLIT BATCH — beberapa spesifikasi dalam satu tempel
// ------------------------------------------------------------
//  Pisahkan blok dengan baris berisi "---" (atau lebih).
export function splitSpecs(text) {
  return String(text || "")
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ------------------------------------------------------------
//  2) PARSER SPESIFIKASI — teks bebas → data terstruktur
// ------------------------------------------------------------

const NUM = "([\\d.,]+)";

function toNumber(s) {
  if (s == null) return 0;
  const cleaned = String(s).replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// "2,5 M" → 2500000000 · "850 juta" → 850000000 · "8,5jt" → 8500000
function parseRupiah(raw) {
  const m = String(raw).match(new RegExp(`${NUM}\\s*(m|miliar|milyar|jt|juta|rb|ribu)?`, "i"));
  if (!m) return 0;
  const n = toNumber(m[1]);
  const unit = (m[2] || "").toLowerCase();
  if (["m", "miliar", "milyar"].includes(unit)) return Math.round(n * 1_000_000_000);
  if (["jt", "juta"].includes(unit)) return Math.round(n * 1_000_000);
  if (["rb", "ribu"].includes(unit)) return Math.round(n * 1_000);
  return Math.round(n);
}

function matchNum(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return toNumber(m[1]);
  }
  return 0;
}

// Bersihkan artefak WhatsApp: "[4/7, 11.02] Nama:" di awal baris.
function stripWa(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.replace(/^\[\d{1,2}\/\d{1,2}(?:\/\d{2,4})?,?\s*\d{1,2}[.:]\d{2}(?:[.:]\d{2})?\]\s*[^:]{0,40}:\s*/, ""))
    .join("\n")
    .trim();
}

// Baris berlabel "Luas Tanah : 180" / "Hadap: Timur" → nilai.
function labeled(text, labels) {
  const re = new RegExp(`^\\s*\\*?\\s*(?:${labels})\\s*[:=]\\s*(.+)$`, "im");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

// "4+1" → { main: 4, extra: 1 }
function plusNum(s) {
  const m = String(s || "").match(/(\d+)\s*(?:\+\s*(\d+))?/);
  return m ? { main: Number(m[1]), extra: Number(m[2] || 0) } : { main: 0, extra: 0 };
}

// Parser offline: cukup pintar untuk format iklan WA/marketplace umum.
export function parseSpecOffline(raw) {
  const text = stripWa(raw);
  const lower = text.toLowerCase();

  const type =
    /apartemen|apartment|apartemen studio|kondominium/.test(lower) ? "apartemen"
    : /\b(tanah|kavling|kaveling)\b/.test(lower) ? "tanah"
    : /\b(ruko|rukan|kios)\b/.test(lower) ? "ruko"
    : "rumah";

  const listing = /disewa|sewa|kontrak|per ?bulan|\/bulan|per ?tahun|\/tahun/.test(lower) ? "sewa" : "jual";

  const priceM = lower.match(new RegExp(`(?:harga|hrg|rp)\\s*\\.?:?\\s*(?:rp\\s*\\.?)?\\s*${NUM}\\s*(m|miliar|milyar|jt|juta|rb|ribu)?`, "i"));
  const price = priceM ? parseRupiah(priceM[0].replace(/harga|hrg|rp|[.:]/gi, " ")) : 0;

  // "Kamar Tidur : 4+1" → 4 utama (+1 pembantu dicatat).
  const ktRaw = labeled(text, "kamar tidur|kt|k\\. ?tidur");
  const kmRaw = labeled(text, "kamar mandi|km|k\\. ?mandi");
  const kt = plusNum(ktRaw);
  const km = plusNum(kmRaw);
  const bedrooms = kt.main || matchNum(lower, [/(\d+)\s*(?:kt\b|k\.?\s*tidur|kamar tidur)/, /(?:kt|kamar tidur)\s*:?\s*(\d+)/]);
  const bathrooms = km.main || matchNum(lower, [/(\d+)\s*(?:km\b|k\.?\s*mandi|kamar mandi)/, /(?:km|kamar mandi)\s*:?\s*(\d+)/]);
  const carports = matchNum(lower, [/(?:carport|garasi)\s*:?\s*(\d+)/, /(\d+)\s*(?:carport|garasi)/]);
  const landSize = toNumber(labeled(text, "luas tanah|lt")) || matchNum(lower, [new RegExp(`(?:lt|luas tanah)\\s*\\.?:?\\s*${NUM}`), new RegExp(`${NUM}\\s*m2?\\s*(?:tanah)`)]);
  const buildingSize = toNumber(labeled(text, "luas bangunan|lb")) || matchNum(lower, [new RegExp(`(?:lb|luas bangunan)\\s*\\.?:?\\s*${NUM}`), new RegExp(`${NUM}\\s*m2?\\s*(?:bangunan)`)]);
  const floors = toNumber(labeled(text, "lantai|jumlah lantai")) || 0;
  const electricity = (labeled(text, "listrik|daya") || lower.match(/listrik\s*([\d.,]+)\s*(?:watt|va|w)/)?.[1] || "").replace(/[^\d]/g, "");
  const facing = labeled(text, "hadap|menghadap") || (lower.match(/hadap\s+(utara|timur|selatan|barat)/)?.[1] ?? "");

  const certM = lower.match(/\b(shm|hgb|shgb|strata|ajb|girik|phtb)\b/);
  const certificate = certM ? certM[1].toUpperCase() : "SHM";
  const furnished = /full furnish/.test(lower) ? "Full furnished" : /semi furnish/.test(lower) ? "Semi furnished" : "";

  // Cluster: "Rumah Cluster Greenhill, Citraland Utara"
  const clusterM = text.match(/(?:cluster|perumahan|residence)\s+([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)*)/i);
  const cluster = clusterM ? clusterM[1].trim().slice(0, 60) : "";

  const locM =
    text.match(/(?:lokasi|alamat|di daerah|daerah)\s*\.?:?\s*(.+)/i) ||
    (clusterM && text.slice(clusterM.index + clusterM[0].length).match(/^\s*,\s*([^\n]+)/)) ||
    text.match(/\bdi\s+([A-Z][^,.\n]+(?:,\s*[A-Z][^,.\n]+)?)/);
  const location = (locM ? locM[1] : "").split("\n")[0].trim().slice(0, 80);

  // Selling point dari PEMILIK (blok "Selling point ... :" diikuti bullet).
  let sellerPoints = [];
  const spM = text.match(/selling\s*point[^\n]*:?\s*\n([\s\S]+?)(?=\n\s*\n[A-Z]|$)/i);
  if (spM) {
    sellerPoints = spM[1]
      .split("\n")
      .map((l) => l.replace(/^\s*[*•\-–]\s*/, "").trim())
      .filter((l) => l && l.length > 3)
      .slice(0, 12);
  }

  // Catatan internal (komisi, nego, dsb.) — TIDAK untuk dipublikasikan.
  const internalNotes = (text.match(/[^\n]*komisi[^\n]*/gi) || []).join(" ").trim();

  const extraBits = [];
  if (kt.extra) extraBits.push(`+${kt.extra} kamar pembantu`);
  if (km.extra) extraBits.push(`+${km.extra} kamar mandi pembantu`);

  return {
    type,
    listing,
    location,
    cluster,
    price,
    bedrooms,
    bathrooms,
    carports,
    landSize,
    buildingSize,
    floors,
    electricity,
    facing,
    furnished,
    certificate,
    sellerPoints,
    internalNotes,
    extra: [extraBits.join(", "), text.slice(0, 600)].filter(Boolean).join(". "),
  };
}

// Parser AI (model fast — tugas mekanis, murah): pemahaman lebih dalam.
export async function parseSpec(raw) {
  const offline = parseSpecOffline(raw);
  if (!aiEnabled()) return { ...offline, aiUsed: false };

  try {
    const text = await ask({
      tier: "fast",
      maxTokens: 900,
      system:
        "Anda parser data properti Indonesia. Ekstrak data terstruktur dari teks iklan/broadcast WA " +
        "(abaikan timestamp '[4/7, 11.02] Nama:'). Balas HANYA JSON valid, tanpa teks lain.",
      content:
        `Teks spesifikasi:\n"""\n${String(raw).slice(0, 3000)}\n"""\n\n` +
        "Balas JSON persis:\n" +
        `{
  "type": "rumah|apartemen|tanah|ruko",
  "listing": "jual|sewa",
  "location": "kawasan/kota, mis. 'Citraland Utara, Surabaya'",
  "cluster": "nama cluster/perumahan bila ada, mis. 'Greenhill'",
  "price": 0,
  "bedrooms": 0, "bathrooms": 0, "carports": 0,
  "landSize": 0, "buildingSize": 0, "floors": 0,
  "electricity": "5500", "facing": "Timur", "furnished": "Full furnished|Semi furnished|",
  "certificate": "SHM|HGB|Strata|AJB|-",
  "sellerPoints": ["selling point yang DITULIS PEMILIK, apa adanya"],
  "internalNotes": "info internal agen (komisi, nego, deadline) — JANGAN masuk iklan",
  "extra": "fasilitas/keunggulan lain: kamar pembantu, gudang, kitchen set, taman, dll"
}\n` +
        "Aturan: harga Rupiah penuh TANPA pemisah ribuan (3,4 M = 3400000000). 'Kamar Tidur: 4+1' → bedrooms 4, catat '+1 kamar pembantu' di extra. Gunakan 0/'' bila tidak disebut.",
    });
    const data = parseJson(text);
    if (!data) return { ...offline, aiUsed: false };
    return {
      type: TYPE_LABELS[data.type] ? data.type : offline.type,
      listing: data.listing === "sewa" ? "sewa" : "jual",
      location: data.location || offline.location,
      cluster: data.cluster || offline.cluster,
      price: Number(data.price) || offline.price,
      bedrooms: Number(data.bedrooms) || offline.bedrooms,
      bathrooms: Number(data.bathrooms) || offline.bathrooms,
      carports: Number(data.carports) || offline.carports,
      landSize: Number(data.landSize) || offline.landSize,
      buildingSize: Number(data.buildingSize) || offline.buildingSize,
      floors: Number(data.floors) || offline.floors,
      electricity: data.electricity || offline.electricity,
      facing: data.facing || offline.facing,
      furnished: data.furnished || offline.furnished,
      certificate: data.certificate && data.certificate !== "-" ? data.certificate : offline.certificate,
      sellerPoints: Array.isArray(data.sellerPoints) && data.sellerPoints.length ? data.sellerPoints : offline.sellerPoints,
      internalNotes: data.internalNotes || offline.internalNotes,
      extra: data.extra || offline.extra,
      aiUsed: true,
    };
  } catch (err) {
    console.error("parseSpec AI error:", err?.message || err);
    return { ...offline, aiUsed: false };
  }
}

// ------------------------------------------------------------
//  3) PIPELINE PENUH — satu spesifikasi → listing terbit
// ------------------------------------------------------------
//  opts: { publish=true, marketing=true, images=[{media_type,data}] }
export async function runAutoListing(rawSpec, opts = {}) {
  const { publish = true, marketing: withMarketing = true, images: photos = [] } = opts;
  const stages = [];
  const done = (name) => stages.push({ name, status: "done" });

  // a. Parse spesifikasi
  const details = await parseSpec(rawSpec);
  done("Parse spesifikasi");

  // b. Konten AI (judul, deskripsi, selling points, SEO) — sertakan foto bila ada
  const content = await generateListing({ details, images: photos });
  done("Analisis konten");

  // b2. Titik peta + analisis kawasan (strategis & tempat terdekat)
  const locationFull = [details.cluster, details.location].filter(Boolean).join(", ");
  const [geo, locationInsight] = await Promise.all([
    geocode(locationFull || details.location),
    generateLocationInsight({ location: locationFull || details.location, type: details.type, listing: details.listing }),
  ]);
  done("Analisis lokasi");

  // c. Aset visual — foto asli yang diunggah dipakai (cover pilihan AI di depan);
  //    hanya jika tak ada foto, pakai foto stok sesuai tipe.
  let images;
  if (photos.length) {
    const urls = await saveImagesToUploads(photos);
    if (urls.length) {
      const idx = content.coverIndex >= 0 && content.coverIndex < urls.length ? content.coverIndex : 0;
      images = [urls[idx], ...urls.filter((_, i) => i !== idx)];
    } else {
      images = suggestImages(details.type, 4); // upload gagal → foto stok
    }
  } else {
    images = suggestImages(details.type, 4);
  }
  let assembled = {
    ...details,
    title: content.title,
    description: content.description,
    highlights: content.highlights || [],
    tags: content.tags || [],
    photoCaptions: content.photoCaptions || [],
    seoTitle: content.seoTitle,
    images,
  };
  const coverSvg = buildCoverSvg(assembled);
  done("Aset visual");

  // d. Materi marketing
  let marketing = null;
  if (withMarketing) {
    marketing = await generateMarketing({ listing: assembled });
    done("Materi marketing");
  }

  // e. Simpan / publikasikan
  const record = saveListing({
    title: assembled.title,
    type: assembled.type,
    listing: assembled.listing,
    price: Number(assembled.price) || 0,
    priceUnit: assembled.listing === "sewa" ? "bulan" : undefined,
    location: assembled.location || "",
    cluster: assembled.cluster || "",
    city: (assembled.location || "").split(",").pop()?.trim() || "",
    bedrooms: Number(assembled.bedrooms) || 0,
    bathrooms: Number(assembled.bathrooms) || 0,
    carports: Number(assembled.carports) || 0,
    landSize: Number(assembled.landSize) || 0,
    buildingSize: Number(assembled.buildingSize) || 0,
    floors: Number(assembled.floors) || 0,
    electricity: assembled.electricity || "",
    facing: assembled.facing || "",
    furnished: assembled.furnished || "",
    certificate: assembled.certificate || "SHM",
    sellerPoints: details.sellerPoints || [],
    internalNotes: details.internalNotes || "",
    description: assembled.description || "",
    tags: assembled.tags,
    highlights: assembled.highlights,
    sellingPoints: content.sellingPoints || [],
    targetBuyers: content.targetBuyers || [],
    photoCaptions: content.photoCaptions || [],
    seoTitle: assembled.seoTitle,
    images: assembled.images,
    geo: geo ? { lat: geo.lat, lng: geo.lng } : null,
    locationInsight,
    agent: {
      name: "RumahPlus Curated",
      company: "RumahPlus",
      phone: "0812-0000-0000",
      verified: true,
      rating: 4.8,
    },
    marketing,
    sourceSpec: String(rawSpec).slice(0, 2000),
    status: publish ? "published" : "draft",
  });
  done(publish ? "Publikasi halaman" : "Simpan draf");

  addJob({
    type: "autopilot",
    title: record.title,
    slug: record.slug,
    stages,
    result: `/properti/${record.slug}`,
    aiUsed: Boolean(details.aiUsed || content.aiUsed),
  });

  return {
    ok: true,
    slug: record.slug,
    url: `/properti/${record.slug}`,
    title: record.title,
    status: record.status,
    listing: record,
    coverSvg,
    marketing,
    stages,
    aiUsed: Boolean(details.aiUsed || content.aiUsed),
    pptUrl: `/api/admin/ppt?slug=${encodeURIComponent(record.slug)}`,
  };
}

// Batch: beberapa spesifikasi sekaligus (dipisah "---").
// Bila ada foto, seluruh teks diperlakukan sebagai SATU properti
// (foto milik satu rumah, tidak dipecah).
export async function runAutoBatch(text, opts = {}) {
  const { images = [] } = opts;
  const specs = images.length ? [String(text).trim()] : splitSpecs(text);
  const results = [];
  for (const spec of specs) {
    try {
      results.push(await runAutoListing(spec, opts));
    } catch (err) {
      results.push({ ok: false, error: String(err?.message || err), spec: spec.slice(0, 120) });
    }
  }
  return { total: specs.length, succeeded: results.filter((r) => r.ok).length, results };
}

// ------------------------------------------------------------
//  4) ANTREAN OTOMASI — spesifikasi menunggu diproses cron
// ------------------------------------------------------------

export function getAutopilotSettings() {
  const s = getSettings();
  return { enabled: true, queue: [], lastRun: null, ...(s.autopilot || {}) };
}

export function addToQueue(spec) {
  const ap = getAutopilotSettings();
  const item = { id: "Q-" + Math.random().toString(36).slice(2, 8), spec: String(spec).trim(), addedAt: new Date().toISOString() };
  updateSettings({ autopilot: { ...ap, queue: [...ap.queue, item] } });
  return item;
}

export function removeFromQueue(id) {
  const ap = getAutopilotSettings();
  updateSettings({ autopilot: { ...ap, queue: ap.queue.filter((q) => q.id !== id) } });
}

// Dipanggil cron: proses satu item terdepan dari antrean.
export async function runQueueNext() {
  const ap = getAutopilotSettings();
  if (!ap.enabled) return { ok: false, error: "Otomasi dinonaktifkan" };
  if (!ap.queue.length) return { ok: false, error: "Antrean kosong" };

  const [next, ...rest] = ap.queue;
  const result = await runAutoListing(next.spec, { publish: true, marketing: true });
  updateSettings({ autopilot: { ...ap, queue: rest, lastRun: new Date().toISOString() } });
  return { ...result, remaining: rest.length };
}
