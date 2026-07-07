// ============================================================
//  CMA — Comparative Market Analysis / Mesin Harga
//
//  Alat paling menentukan bagi agen: menetapkan harga wajar,
//  memenangkan mandat jual (listing presentation), dan memberi
//  strategi nego berbasis data pembanding nyata di katalog.
//
//  Mengikuti metode appraisal: sales comparison approach —
//  bandingkan subjek dengan properti serupa (tipe, kawasan,
//  ukuran), hitung harga per m², lalu posisikan.
// ============================================================

import { aiEnabled, ask, parseJson } from "@/lib/ai";
import { TYPE_LABELS } from "@/data";
import { formatPrice } from "@/lib/utils";

// m² acuan harga per tipe: bangunan untuk hunian/ruko, tanah untuk kavling.
function refArea(l) {
  if (l.type === "tanah") return Number(l.landSize) || 0;
  return Number(l.buildingSize) || Number(l.landSize) || 0;
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function tokens(s) {
  return String(s || "")
    .toLowerCase()
    .split(/[\s,./]+/)
    .filter((w) => w.length > 2);
}

// Skor kemiripan: kawasan (kuat), tipe, kedekatan ukuran & kamar.
function similarity(subject, comp) {
  let score = 0;
  if (comp.type === subject.type) score += 3;
  if (comp.listing === subject.listing) score += 2;

  const subLoc = tokens(`${subject.cluster || ""} ${subject.location || ""} ${subject.city || ""}`);
  const compLoc = tokens(`${comp.cluster || ""} ${comp.location || ""} ${comp.city || ""}`);
  const overlap = subLoc.filter((t) => compLoc.includes(t)).length;
  score += Math.min(overlap, 4) * 2; // lokasi paling menentukan

  const a1 = refArea(subject), a2 = refArea(comp);
  if (a1 && a2) {
    const diff = Math.abs(a1 - a2) / Math.max(a1, a2);
    if (diff < 0.15) score += 3;
    else if (diff < 0.35) score += 1.5;
  }
  if (subject.bedrooms && comp.bedrooms && Math.abs(subject.bedrooms - comp.bedrooms) <= 1) score += 1;
  return score;
}

// Hanya pembanding di DAERAH SEKITAR (kota/kawasan sama) — bukan seluruh
// Indonesia. Wajib: kota sama ATAU berbagi kata lokasi (kawasan/cluster).
export function findComparables(subject, pool, limit = 6) {
  const subLoc = tokens(`${subject.cluster || ""} ${subject.location || ""} ${subject.city || ""}`);
  const sameArea = (l) => {
    if (subject.city && l.city && subject.city.toLowerCase() === l.city.toLowerCase()) return true;
    const compLoc = tokens(`${l.cluster || ""} ${l.location || ""} ${l.city || ""}`);
    return subLoc.some((t) => compLoc.includes(t));
  };
  return pool
    .filter(
      (l) =>
        l.slug !== subject.slug &&
        l.price > 0 &&
        refArea(l) > 0 &&
        l.listing === subject.listing &&
        l.type === subject.type && // tipe sama
        sameArea(l) // daerah sekitar saja
    )
    .map((l) => ({ l, score: similarity(subject, l) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.l);
}

// Statistik harga per m² dari pembanding + posisi subjek.
export function priceStats(subject, comps) {
  const rows = comps.map((c) => ({
    slug: c.slug,
    title: c.title,
    location: [c.cluster, c.location].filter(Boolean).join(", "),
    price: c.price,
    listing: c.listing,
    priceUnit: c.priceUnit,
    area: refArea(c),
    ppsqm: Math.round(c.price / refArea(c)),
    bedrooms: c.bedrooms,
    landSize: c.landSize,
    buildingSize: c.buildingSize,
  }));
  const ppsqms = rows.map((r) => r.ppsqm).filter(Boolean);
  const stats = {
    count: rows.length,
    minPpsqm: ppsqms.length ? Math.min(...ppsqms) : 0,
    medianPpsqm: median(ppsqms),
    maxPpsqm: ppsqms.length ? Math.max(...ppsqms) : 0,
  };

  const subArea = refArea(subject);
  const subPrice = Number(subject.price) || 0;
  const subPpsqm = subArea && subPrice ? Math.round(subPrice / subArea) : 0;

  // Estimasi harga wajar dari median × luas subjek.
  const fairMid = stats.medianPpsqm && subArea ? stats.medianPpsqm * subArea : 0;
  const fairLow = Math.round(fairMid * 0.93);
  const fairHigh = Math.round(fairMid * 1.08);

  // Posisi subjek vs median (persen).
  const vsMedian = stats.medianPpsqm && subPpsqm ? Math.round(((subPpsqm - stats.medianPpsqm) / stats.medianPpsqm) * 100) : null;

  return { rows, stats, subArea, subPrice, subPpsqm, fair: { low: fairLow, mid: Math.round(fairMid), high: fairHigh }, vsMedian };
}

// ---------- Analisis AI (model smart — bernalar, konteks pasar) ----------
export async function generateCMA(subject, comps) {
  const data = priceStats(subject, comps);
  const offline = fallbackCMA(subject, data);
  if (!aiEnabled()) return { ...data, analysis: offline, aiUsed: false };

  const compLines = data.rows
    .map((r) => `- ${r.title} | ${r.location} | ${formatPrice(r.price, r.listing, r.priceUnit)} | ${r.area} m² | Rp ${r.ppsqm.toLocaleString("id-ID")}/m²`)
    .join("\n") || "(tidak ada pembanding di katalog)";

  const subLine =
    `Tipe ${TYPE_LABELS[subject.type] || subject.type}, ${subject.listing === "sewa" ? "sewa" : "jual"}, ` +
    `${[subject.cluster, subject.location].filter(Boolean).join(", ")}, ` +
    `LT ${subject.landSize || "-"} / LB ${subject.buildingSize || "-"} m², ${subject.bedrooms || "-"} KT. ` +
    `Harga diminta: ${data.subPrice ? formatPrice(data.subPrice, subject.listing) : "belum ditentukan"} ` +
    `(≈ Rp ${data.subPpsqm ? data.subPpsqm.toLocaleString("id-ID") : "-"}/m²).`;

  try {
    const text = await ask({
      tier: "smart",
      maxTokens: 1800,
      system:
        "Anda appraiser & listing strategist properti Indonesia. Lakukan Comparative Market Analysis (CMA) " +
        "dengan metode sales comparison. PENTING: fokus HANYA pada pasar di kawasan/kota subjek — " +
        "bandingkan dengan properti di area sekitar saja, JANGAN dengan kota atau daerah lain di Indonesia. " +
        "Gunakan angka pembanding yang diberikan + pengetahuan Anda tentang kawasan spesifik itu. " +
        "Jujur, berbasis data, siap dipakai memenangkan mandat jual dari pemilik. Balas HANYA JSON valid.",
      content:
        `SUBJEK:\n${subLine}\n\n` +
        `Analisis khusus untuk pasar di: ${[subject.cluster, subject.location, subject.city].filter(Boolean).join(", ")} — dan area sekitarnya saja.\n\n` +
        `PEMBANDING (dari katalog, area sekitar):\n${compLines}\n\n` +
        `Statistik harga/m² pembanding: min Rp ${data.stats.minPpsqm.toLocaleString("id-ID")}, ` +
        `median Rp ${data.stats.medianPpsqm.toLocaleString("id-ID")}, max Rp ${data.stats.maxPpsqm.toLocaleString("id-ID")}.\n\n` +
        "Balas JSON persis:\n" +
        `{
  "verdict": "1-2 kalimat posisi harga subjek (over/under/wajar) vs kawasan",
  "recommendedList": { "low": 0, "high": 0, "note": "rentang harga LISTING yang disarankan (Rupiah penuh) + alasan singkat" },
  "pricePerSqm": "komentar harga per m² subjek vs median pembanding",
  "negotiation": { "roomPercent": 0, "strategy": "ruang nego wajar (%) + strategi buka harga & lantai harga" },
  "estDaysToSell": { "days": 0, "note": "estimasi hari sampai terjual pada harga wajar + faktor" },
  "mandateTalkingPoints": ["3-4 argumen berbasis data untuk meyakinkan pemilik memberi mandat & menetapkan harga realistis"],
  "risks": ["2-3 risiko/keberatan yang mungkin muncul + cara menjawabnya"]
}\n` +
        "Angka Rupiah penuh TANPA pemisah ribuan (mis. 2500000000, bukan 2.500.000.000). " +
        "Jangan gunakan tanda petik ganda di dalam nilai teks. Bila pembanding minim, tetap beri estimasi + tandai keyakinan rendah.",
    });
    const parsed = parseJson(text);
    if (!parsed) return { ...data, analysis: offline, aiUsed: false };
    return { ...data, analysis: parsed, aiUsed: true };
  } catch (err) {
    console.error("generateCMA error:", err?.message || err);
    return { ...data, analysis: offline, aiUsed: false };
  }
}

function fallbackCMA(subject, data) {
  const { fair, stats, vsMedian, subArea } = data;
  const verdict =
    vsMedian == null
      ? "Data pembanding belum cukup untuk penilaian pasti — gunakan estimasi awal ini sebagai titik mulai."
      : vsMedian > 8
      ? `Harga subjek sekitar ${vsMedian}% di atas median kawasan — cenderung mahal, siapkan justifikasi keunggulan.`
      : vsMedian < -8
      ? `Harga subjek sekitar ${Math.abs(vsMedian)}% di bawah median — ada ruang naik atau potensi cepat laku.`
      : "Harga subjek berada di kisaran wajar kawasan.";
  return {
    verdict,
    recommendedList: { low: fair.low, high: fair.high, note: `Berdasarkan median Rp ${stats.medianPpsqm.toLocaleString("id-ID")}/m² × ${subArea} m² pembanding sekelas.` },
    pricePerSqm: stats.medianPpsqm ? `Median pembanding Rp ${stats.medianPpsqm.toLocaleString("id-ID")}/m².` : "Belum ada pembanding untuk harga per m².",
    negotiation: { roomPercent: 5, strategy: "Buka 5–8% di atas harapan bersih, beri lantai harga di angka wajar median." },
    estDaysToSell: { days: 60, note: "Estimasi umum; harga di/di bawah median mempercepat, di atas median memperlambat." },
    mandateTalkingPoints: [
      "Harga ini disandingkan langsung dengan properti sebanding yang sedang dipasarkan di kawasan.",
      "Penetapan harga realistis di awal mempercepat penjualan dan menghindari listing basi.",
      "Materi pemasaran (halaman, PPT, sosial) sudah siap untuk memaksimalkan eksposur.",
    ],
    risks: ["Pembanding terbatas menurunkan keyakinan — perbanyak data area.", "Kondisi & lokasi mikro bisa menggeser nilai ±10%."],
  };
}
