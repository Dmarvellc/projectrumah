// ============================================================
//  RumahPlus AI — Foto → Deskripsi & Generator Artikel
//
//  Memakai Claude (Anthropic) bila ANTHROPIC_API_KEY tersedia.
//  Tanpa API key, otomatis memakai fallback generator offline
//  sehingga aplikasi tetap berfungsi penuh untuk demo.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { TYPE_LABELS } from "@/data";
import { formatPrice } from "@/lib/utils";
import { nearbyPOIs } from "@/lib/geo";

// ------------------------------------------------------------
//  Routing model otomatis — efisiensi biaya tanpa korban kualitas.
//  fast  (Haiku)  : tugas mekanis — parsing teks, copy pendek.
//  smart (Sonnet) : tugas bernalar — analisis foto, kawasan, artikel.
//  Bila model smart gagal (overload), otomatis dicoba ulang di fast.
// ------------------------------------------------------------
const MODELS = {
  fast: process.env.AI_MODEL_FAST || "claude-haiku-4-5-20251001",
  smart: process.env.AI_MODEL || "claude-sonnet-4-6",
};

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Satu pintu semua panggilan model: pilih tier, fallback antar-model,
// dengan BATAS WAKTU per panggilan agar total selesai < 60s (batas fungsi
// serverless Vercel). Kalau model utama lambat, ia dibatalkan lalu model
// cepat dicoba; kalau dua-duanya gagal, pemanggil memakai fallback offline
// — jadi pengguna dapat HASIL, bukan 504.
export async function ask({ tier = "smart", system, content, maxTokens = 1500, budgets }) {
  const order = tier === "fast" ? [MODELS.fast, MODELS.smart] : [MODELS.smart, MODELS.fast];
  const times = budgets || (tier === "fast" ? [16000, 34000] : [40000, 10000]);
  let lastErr;
  for (let i = 0; i < order.length; i++) {
    try {
      const res = await client().messages.create(
        { model: order[i], max_tokens: maxTokens, system, messages: [{ role: "user", content }] },
        { timeout: times[i] ?? 44000, maxRetries: 0 }
      );
      return res.content.find((b) => b.type === "text")?.text || "";
    } catch (err) {
      lastErr = err;
      console.error(`ask(${order[i]}) error:`, err?.message || err);
    }
  }
  throw lastErr;
}

// Ambil blok JSON pertama dari teks model, toleran terhadap:
//  - pagar ```json, teks pembuka/penutup
//  - koma menggantung sebelum } atau ]
//  - angka dengan pemisah ribuan (2.631.899.963 / 2,631,899,963)
export function parseJson(text) {
  if (!text) return null;
  let s = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  s = s.slice(start, end + 1);

  const stripThousands = (x) => {
    // Hilangkan pemisah ribuan di dalam angka telanjang (di luar string).
    let out = "";
    let inStr = false;
    for (let i = 0; i < x.length; i++) {
      const ch = x[i];
      if (ch === '"' && x[i - 1] !== "\\") inStr = !inStr;
      if (!inStr && (ch === "." || ch === ",") && /\d/.test(x[i - 1] || "") && /\d{3}\D|\d{3}$/.test(x.slice(i + 1, i + 5))) {
        continue; // buang pemisah ribuan
      }
      out += ch;
    }
    return out;
  };

  const fixes = [
    (x) => x,
    (x) => x.replace(/,(\s*[}\]])/g, "$1"),
    (x) => stripThousands(x).replace(/,(\s*[}\]])/g, "$1"),
  ];
  for (const fix of fixes) {
    try {
      return JSON.parse(fix(s));
    } catch {}
  }
  return null;
}

// ------------------------------------------------------------
//  1) FOTO → DESKRIPSI LISTING
// ------------------------------------------------------------
//  details: { type, listing, location, price, bedrooms, bathrooms,
//             landSize, buildingSize, extra }
//  images:  [{ media_type, data(base64) }]
// ------------------------------------------------------------
export async function generateListing({ details = {}, images = [] }) {
  if (!aiEnabled()) {
    return { ...fallbackListing(details, images.length), aiUsed: false };
  }

  const sys =
    "Anda adalah listing agent properti papan atas Indonesia (top 1%) yang menggabungkan keahlian " +
    "copywriter, penilai (appraiser), dan analis kawasan. Anda memahami cara kerja agen sukses: " +
    "setiap listing dibedah dari banyak sudut pandang — lokasi & akses, nilai investasi & arah " +
    "perkembangan kawasan, kecocokan gaya hidup keluarga, kondisi fisik bangunan, sampai legalitas " +
    "dan kemudahan pembiayaan. Anda mengenal kawasan, cluster, dan developer di Indonesia; gunakan " +
    "pengetahuan itu untuk membaca alamat/cluster yang diberikan (fasilitas kawasan, reputasi, akses " +
    "tol/transportasi umum, area komersial terdekat). Semua klaim harus masuk akal dan tidak " +
    "melebih-lebihkan; bila tidak yakin, gunakan frasa hati-hati. " +
    "WAJIB membalas HANYA dengan JSON valid sesuai skema, tanpa teks lain.";

  const facts = factSheet(details);
  const content = [];
  for (const img of images.slice(0, 12)) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.media_type, data: img.data },
    });
  }
  content.push({
    type: "text",
    text:
      `DATA PROPERTI DARI PENJUAL:\n${facts}\n\n` +
      (images.length
        ? `ANALISIS FOTO (${images.length} foto, urutan 0..${images.length - 1}): bedah satu per satu — ruangan apa, kondisi, material, pencahayaan, daya tarik nyata. Tentukan foto mana paling kuat sebagai cover (biasanya fasad/ruang paling fotogenik). Jangan mengarang fitur yang tidak terlihat.\n\n`
        : "Tidak ada foto; analisis berdasarkan data & pengetahuan kawasan saja.\n\n") +
      "TUGAS: susun materi listing kelas premium. Balas JSON berformat persis:\n" +
      `{
  "title": "judul iklan 6-10 kata, spesifik & menjual (sebut keunggulan paling kuat)",
  "description": "4-5 paragraf (pisah \\n\\n). P1: hook + gambaran besar. P2: detail fisik dari foto (ruangan, material, kondisi). P3: kawasan & akses (bedah alamat/cluster: tol, sekolah, RS, komersial). P4: nilai investasi/arah perkembangan area. P5: ajakan + info legalitas/pembiayaan.",
  "sellingPoints": [
    { "aspect": "Lokasi & Akses", "point": "1 kalimat tajam", "detail": "1-2 kalimat pendukung dengan hal spesifik" },
    { "aspect": "Nilai & Investasi", "point": "...", "detail": "..." },
    { "aspect": "Keluarga & Gaya Hidup", "point": "...", "detail": "..." },
    { "aspect": "Kondisi & Bangunan", "point": "...", "detail": "..." },
    { "aspect": "Legalitas & Pembiayaan", "point": "...", "detail": "..." }
  ],
  "targetBuyers": ["2-3 persona pembeli paling cocok + alasan singkat, mis. 'Keluarga muda dengan anak sekolah — 5 menit ke sekolah internasional'"],
  "coverIndex": 0,
  "photoCaptions": ["caption singkat per foto sesuai urutan, mis. 'Fasad modern dengan carport 2 mobil'"],
  "highlights": ["5-7 poin keunggulan singkat berbasis fakta"],
  "tags": ["4-6 label pendek mis. 'Cluster','Bebas Banjir','Dekat Tol'"],
  "seoTitle": "judul SEO < 60 karakter mengandung lokasi & tipe"
}`,
  });

  try {
    // Analisis foto + kawasan = tugas bernalar → model smart.
    const text = await ask({ tier: "smart", system: sys, content, maxTokens: 2600 });
    const data = parseJson(text);
    if (!data || !data.description) {
      return { ...fallbackListing(details, images.length), aiUsed: false };
    }
    return {
      title: data.title || fallbackTitle(details),
      description: data.description,
      sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
      targetBuyers: Array.isArray(data.targetBuyers) ? data.targetBuyers : [],
      coverIndex: Number.isInteger(data.coverIndex) && data.coverIndex >= 0 && data.coverIndex < images.length ? data.coverIndex : 0,
      photoCaptions: Array.isArray(data.photoCaptions) ? data.photoCaptions : [],
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      seoTitle: data.seoTitle || data.title || fallbackTitle(details),
      aiUsed: true,
    };
  } catch (err) {
    console.error("generateListing AI error:", err?.message || err);
    return { ...fallbackListing(details, images.length), aiUsed: false, error: String(err?.message || err) };
  }
}

// ------------------------------------------------------------
//  1b) ANALISIS LOKASI — strategis di mana & apa yang terdekat
// ------------------------------------------------------------
export async function generateLocationInsight({ location, type, listing, lat, lng }) {
  if (!location) return { ...fallbackInsight(location), aiUsed: false };

  // Tempat terdekat NYATA dari OpenStreetMap (bila koordinat tersedia).
  let realNearby = [];
  if (lat && lng) {
    try {
      realNearby = await nearbyPOIs(lat, lng);
    } catch {}
  }

  if (!aiEnabled()) {
    const fb = fallbackInsight(location);
    return { ...fb, nearby: realNearby.length ? realNearby : fb.nearby, aiUsed: false };
  }

  try {
    // Beri AI daftar tempat nyata agar narasi strategisnya berpijak pada fakta.
    const poiHint = realNearby.length
      ? `\n\nTempat nyata terdeteksi di sekitar (dari peta): ${realNearby.map((n) => `${n.name} (${n.category}, ±${n.minutes} mnt)`).join("; ")}.`
      : "";
    const text = await ask({
      tier: "smart",
      maxTokens: 1000,
      system:
        "Anda analis kawasan properti Indonesia yang mengenal kota, kawasan, dan cluster besar. " +
        "Berikan analisis lokasi KONKRET berbasis fakta. Balas HANYA JSON valid.",
      content:
        `Lokasi properti: "${location}" (tipe: ${type || "rumah"}, status: ${listing === "sewa" ? "disewakan" : "dijual"}).${poiHint}\n\n` +
        "Balas JSON persis:\n" +
        `{
  "summary": "1-2 kalimat: posisi strategis lokasi ini dalam peta kota/kawasan",
  "strategic": ["3-5 alasan strategis spesifik (akses tol/transport, arah pengembangan, pusat ekonomi, fasilitas dari daftar nyata di atas bila relevan)"]
}`,
    });
    const data = parseJson(text) || {};
    const fb = fallbackInsight(location);
    return {
      summary: data.summary || fb.summary,
      strategic: Array.isArray(data.strategic) && data.strategic.length ? data.strategic : fb.strategic,
      nearby: realNearby.length ? realNearby : fb.nearby,
      aiUsed: true,
    };
  } catch (err) {
    console.error("generateLocationInsight AI error:", err?.message || err);
    const fb = fallbackInsight(location);
    return { ...fb, nearby: realNearby.length ? realNearby : fb.nearby, aiUsed: false };
  }
}

// ------------------------------------------------------------
//  2) GENERATOR ARTIKEL
// ------------------------------------------------------------
//  Menghasilkan artikel PANJANG (1200+ kata) dengan bagian ber-heading.
//  Hasil: { title, excerpt, category, readMinutes, keywords, sections:[{heading, paragraphs:[]}] }
export async function generateArticle({ topic, audience }) {
  if (!aiEnabled()) {
    return { ...fallbackArticle(topic), aiUsed: false };
  }

  const sys =
    "Anda jurnalis & penulis konten properti senior di Indonesia. Tulis artikel yang DALAM dan BERBOBOT: " +
    "angka konkret, contoh nyata, langkah praktis, dan konteks pasar Indonesia — bukan kalimat generik. " +
    "Tanpa klaim berlebihan. Balas HANYA JSON valid sesuai skema.";

  const prompt =
    `Topik artikel: "${topic}".` +
    (audience ? ` Target pembaca: ${audience}.` : "") +
    `\n\nTulis artikel utuh minimal 1200 kata: 5-6 bagian, tiap bagian 2-4 paragraf (tiap paragraf 3-5 kalimat).\n` +
    `Balas dengan JSON berformat persis:\n` +
    `{
  "title": "judul artikel menarik & spesifik",
  "excerpt": "ringkasan 2 kalimat yang menjual isi artikel",
  "category": "salah satu: 'Tips & Panduan' | 'Analisis Pasar' | 'Investasi' | 'Gaya Hidup'",
  "keywords": ["4-6 kata kunci SEO"],
  "sections": [
    { "heading": "judul bagian (tanpa nomor)", "paragraphs": ["paragraf lengkap...", "paragraf lengkap..."] }
  ]
}`;

  try {
    // Artikel panjang bernalar → model smart.
    const text = await ask({ tier: "smart", system: sys, content: prompt, maxTokens: 6000, budgets: [120000, 40000] });
    const data = parseJson(text);
    if (!data || !Array.isArray(data.sections) || !data.sections.length) {
      return { ...fallbackArticle(topic), aiUsed: false };
    }
    const words = data.sections.flatMap((s) => s.paragraphs || []).join(" ").split(/\s+/).length;
    return {
      title: data.title || topic,
      excerpt: data.excerpt || "",
      category: data.category || "Tips & Panduan",
      keywords: Array.isArray(data.keywords) ? data.keywords : [topic],
      readMinutes: Math.max(4, Math.round(words / 220)),
      sections: data.sections,
      aiUsed: true,
    };
  } catch (err) {
    console.error("generateArticle AI error:", err?.message || err);
    return { ...fallbackArticle(topic), aiUsed: false, error: String(err?.message || err) };
  }
}

// ------------------------------------------------------------
//  3) MATERI MARKETING (sosial, iklan, email)
// ------------------------------------------------------------
export async function generateMarketing({ listing }) {
  if (!aiEnabled()) return { ...fallbackMarketing(listing), aiUsed: false };

  const sys =
    "Anda social media & performance marketer properti Indonesia. Buat materi promosi yang " +
    "menarik, jujur, dan siap pakai. Balas HANYA JSON valid sesuai skema.";

  const facts = factSheet({
    type: listing.type,
    listing: listing.listing,
    location: listing.location,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    landSize: listing.landSize,
    buildingSize: listing.buildingSize,
  });

  const prompt =
    `Properti:\n${facts}\nJudul: ${listing.title}\n\n` +
    "Balas JSON berformat persis:\n" +
    `{
  "instagram": "caption Instagram menarik dengan emoji seperlunya dan CTA",
  "whatsapp": "pesan broadcast WhatsApp singkat, ramah, dengan CTA",
  "facebook": "posting Facebook 2-3 kalimat",
  "hashtags": ["6-10 hashtag relevan tanpa tanda #"],
  "ad": { "headline": "judul iklan < 40 karakter", "primary": "teks iklan utama 1-2 kalimat" },
  "email": { "subject": "subjek email menarik", "body": "isi email 2 paragraf" }
}`;

  try {
    // Copy pendek dengan format jelas → model fast (hemat biaya).
    const text = await ask({ tier: "fast", system: sys, content: prompt, maxTokens: 1500 });
    const data = parseJson(text);
    if (!data || !data.instagram) return { ...fallbackMarketing(listing), aiUsed: false };
    return { ...fallbackMarketing(listing), ...data, aiUsed: true };
  } catch (err) {
    console.error("generateMarketing AI error:", err?.message || err);
    return { ...fallbackMarketing(listing), aiUsed: false, error: String(err?.message || err) };
  }
}

// ------------------------------------------------------------
//  Fallback offline generators
// ------------------------------------------------------------
function factSheet(d) {
  const lines = [];
  if (d.type) lines.push(`- Tipe: ${TYPE_LABELS[d.type] || d.type}`);
  if (d.listing) lines.push(`- Status: ${d.listing === "sewa" ? "Disewakan" : "Dijual"}`);
  if (d.location) lines.push(`- Lokasi: ${d.location}`);
  if (d.cluster) lines.push(`- Cluster/Perumahan: ${d.cluster}`);
  if (d.address) lines.push(`- Alamat: ${d.address}`);
  if (d.price) lines.push(`- Harga: ${formatPrice(Number(d.price), d.listing)}`);
  if (d.bedrooms) lines.push(`- Kamar tidur: ${d.bedrooms}`);
  if (d.bathrooms) lines.push(`- Kamar mandi: ${d.bathrooms}`);
  if (d.carports) lines.push(`- Carport/garasi: ${d.carports}`);
  if (d.landSize) lines.push(`- Luas tanah: ${d.landSize} m²`);
  if (d.buildingSize) lines.push(`- Luas bangunan: ${d.buildingSize} m²`);
  if (d.floors) lines.push(`- Jumlah lantai: ${d.floors}`);
  if (d.maidRooms) lines.push(`- Kamar pembantu: ${d.maidRooms}`);
  if (d.garage) lines.push(`- Garasi: ${d.garage}`);
  if (d.ipl) lines.push(`- IPL: Rp ${Number(d.ipl).toLocaleString("id-ID")}/bulan`);
  if (d.roadWidth) lines.push(`- Row jalan: ${d.roadWidth} mobil`);
  if (Array.isArray(d.facilities) && d.facilities.length) lines.push(`- Fasilitas: ${d.facilities.join(", ")}`);
  if (d.yearBuilt) lines.push(`- Tahun dibangun/renovasi: ${d.yearBuilt}`);
  if (d.electricity) lines.push(`- Listrik: ${d.electricity} VA`);
  if (d.water) lines.push(`- Air: ${d.water}`);
  if (d.facing) lines.push(`- Hadap: ${d.facing}`);
  if (d.furnished) lines.push(`- Furnitur: ${d.furnished}`);
  if (d.condition) lines.push(`- Kondisi: ${d.condition}`);
  if (d.certificate) lines.push(`- Sertifikat: ${d.certificate}`);
  if (d.imb) lines.push(`- IMB/PBG: ada`);
  if (d.extra) lines.push(`- Catatan penjual: ${d.extra}`);
  if (Array.isArray(d.sellerPoints) && d.sellerPoints.length) {
    lines.push(`- Selling point dari PEMILIK (wajib dipertimbangkan & dirangkai, jangan dibuang):\n  • ${d.sellerPoints.join("\n  • ")}`);
  }
  return lines.join("\n") || "- (data minim)";
}

function fallbackInsight(location) {
  const area = String(location || "").split(",")[0] || "kawasan ini";
  return {
    summary: `${area} merupakan kawasan hunian dengan akses dan fasilitas harian yang memadai.`,
    strategic: [
      `Berada di ${area} dengan akses jalan utama kawasan`,
      "Dekat dengan fasilitas harian: pasar/minimarket, sekolah, dan layanan kesehatan",
      "Kawasan hunian yang sudah hidup — nilai cenderung stabil",
    ],
    nearby: [
      { name: "Minimarket & kebutuhan harian", category: "Kuliner", minutes: 5 },
      { name: "Sekolah terdekat", category: "Sekolah", minutes: 10 },
      { name: "Fasilitas kesehatan", category: "Rumah Sakit", minutes: 15 },
      { name: "Akses jalan utama / tol terdekat", category: "Tol", minutes: 15 },
    ],
  };
}

function fallbackTitle(d) {
  const t = TYPE_LABELS[d.type] || "Properti";
  const loc = d.location ? d.location.split(",")[0] : "";
  const adj = d.listing === "sewa" ? "Disewakan" : "Dijual";
  return `${t} ${adj}${loc ? " di " + loc : ""}`.trim();
}

function fallbackListing(d, imageCount = 0) {
  const t = (TYPE_LABELS[d.type] || "Properti").toLowerCase();
  const loc = d.location || "lokasi strategis";
  const adj = d.listing === "sewa" ? "disewakan" : "dijual";
  const specs = [];
  if (d.bedrooms) specs.push(`${d.bedrooms} kamar tidur`);
  if (d.bathrooms) specs.push(`${d.bathrooms} kamar mandi`);
  if (d.buildingSize) specs.push(`luas bangunan ${d.buildingSize} m²`);
  if (d.landSize) specs.push(`luas tanah ${d.landSize} m²`);
  const specText = specs.length ? specs.join(", ") + "." : "";

  const p1 = `${cap(t)} ${adj} di ${loc}${d.price ? `, dengan penawaran ${formatPrice(Number(d.price), d.listing)}` : ""}. ` +
    `Hunian ini menghadirkan kenyamanan dan nilai investasi yang menarik bagi Anda dan keluarga.`;
  const p2 = (specText ? `Properti memiliki ${specText} ` : "") +
    `${imageCount ? `Tersedia ${imageCount} foto untuk Anda lihat. ` : ""}` +
    `Tata ruang yang fungsional membuat setiap sudut terasa lapang dan nyaman dihuni.`;
  const p3 = `Lokasi ${loc} memberikan akses mudah ke berbagai fasilitas penting. ` +
    `Hubungi kami sekarang untuk informasi lebih lanjut atau jadwalkan kunjungan langsung.`;

  const area = loc.split(",")[0];
  return {
    title: fallbackTitle(d),
    description: [p1, p2, p3].join("\n\n"),
    sellingPoints: [
      { aspect: "Lokasi & Akses", point: `Berada di ${area} dengan akses harian yang praktis`, detail: "Dekat jalan utama kawasan serta fasilitas sehari-hari." },
      { aspect: "Nilai & Investasi", point: "Harga kompetitif untuk kawasannya", detail: "Cocok untuk hunian sekaligus simpanan nilai jangka panjang." },
      d.bedrooms ? { aspect: "Keluarga & Gaya Hidup", point: `${d.bedrooms} kamar tidur untuk kebutuhan keluarga`, detail: "Tata ruang fungsional dan nyaman dihuni." } : null,
      d.certificate ? { aspect: "Legalitas & Pembiayaan", point: `Sertifikat ${d.certificate}`, detail: "Dokumen jelas, memudahkan proses KPR maupun jual-beli." } : null,
    ].filter(Boolean),
    targetBuyers: ["Keluarga yang mencari hunian siap huni", "Investor yang mencari nilai stabil di kawasan berkembang"],
    coverIndex: 0,
    photoCaptions: [],
    highlights: [
      d.bedrooms ? `${d.bedrooms} kamar tidur` : "Tata ruang fungsional",
      d.buildingSize ? `Bangunan ${d.buildingSize} m²` : "Hunian nyaman",
      area ? `Lokasi ${area}` : "Lokasi strategis",
      "Siap huni / investasi",
    ].filter(Boolean),
    tags: [TYPE_LABELS[d.type] || "Properti", d.listing === "sewa" ? "Sewa" : "Jual", "Lokasi Strategis"],
    seoTitle: fallbackTitle(d).slice(0, 60),
  };
}

function fallbackArticle(topic) {
  const t = topic || "Tips Properti";
  return {
    title: t,
    excerpt: `Panduan lengkap seputar "${t}": langkah praktis, biaya yang perlu disiapkan, dan kesalahan yang harus dihindari.`,
    category: "Tips & Panduan",
    keywords: [t, "properti indonesia", "tips properti"],
    readMinutes: 7,
    sections: [
      {
        heading: "Mengapa hal ini penting",
        paragraphs: [
          `${t} adalah salah satu keputusan finansial terbesar yang dihadapi kebanyakan keluarga Indonesia. Nilainya sering setara dengan penghasilan bertahun-tahun, sehingga kesalahan kecil di awal bisa berdampak panjang — mulai dari cicilan yang mencekik hingga sengketa legalitas yang menguras waktu dan biaya.`,
          `Pasar properti Indonesia juga sangat beragam antarwilayah. Harga tanah di kawasan penyangga kota besar bisa naik dua digit per tahun saat infrastruktur baru dibangun, sementara area lain justru stagnan. Memahami konteks lokal jauh lebih menentukan daripada sekadar mengikuti tren nasional.`,
        ],
      },
      {
        heading: "Persiapan yang sering dilewatkan",
        paragraphs: [
          `Mulailah dari angka, bukan dari unit yang menarik hati. Hitung kemampuan cicilan maksimal — idealnya tidak melebihi 30% penghasilan bulanan bersih — lalu tambahkan biaya-biaya yang jarang dihitung: BPHTB sekitar 5% dari NJOP/harga transaksi, biaya notaris dan AJB, biaya provisi KPR, asuransi, hingga dana renovasi awal yang umumnya 5–10% dari harga beli.`,
          `Periksa legalitas sebelum jatuh cinta pada propertinya. Sertifikat (SHM/HGB), IMB/PBG, dan kesesuaian nama penjual adalah syarat minimum. Untuk properti indent dari developer, telusuri rekam jejak proyek sebelumnya dan status tanah induknya.`,
          `Survei lokasi pada jam yang berbeda: pagi saat berangkat kerja untuk menguji akses, sore untuk melihat kepadatan, dan saat hujan deras untuk memastikan bebas banjir. Tetangga dan warung sekitar sering menjadi sumber informasi paling jujur.`,
        ],
      },
      {
        heading: "Langkah eksekusi yang aman",
        paragraphs: [
          `Bandingkan minimal tiga properti serupa di radius yang sama sebelum menawar. Selisih harga per meter persegi antariklan bisa 10–20%, dan data pembanding adalah amunisi negosiasi terbaik Anda. Jangan ragu menawar — di pasar sekunder, ruang negosiasi 5–15% adalah hal wajar.`,
          `Gunakan jasa profesional pada titik-titik kritis: notaris/PPAT untuk transaksi, appraisal independen bila nilainya besar, dan agen tepercaya bila Anda tidak sempat mengurus sendiri. Biayanya kecil dibanding risiko yang dihindari.`,
          `Terakhir, dokumentasikan semuanya. Setiap pembayaran harus ada bukti transfer dan kuitansi, setiap kesepakatan harus tertulis. Keputusan yang matang hari ini menentukan kenyamanan dan nilai investasi Anda bertahun-tahun ke depan.`,
        ],
      },
    ],
  };
}

function fallbackMarketing(listing) {
  const price = formatPrice(Number(listing.price), listing.listing, listing.priceUnit);
  const loc = listing.location || "lokasi strategis";
  const t = TYPE_LABELS[listing.type] || "Properti";
  const adj = listing.listing === "sewa" ? "Disewakan" : "Dijual";
  return {
    instagram:
      `✨ ${adj}: ${listing.title}\n📍 ${loc}\n💰 ${price}\n\n` +
      `Hunian idaman dengan lokasi strategis dan legalitas jelas. Jangan sampai kelewatan!\n` +
      `Info & survei: hubungi kami sekarang. Link di bio.`,
    whatsapp:
      `Halo! Ada properti menarik nih 👇\n*${listing.title}*\n📍 ${loc}\n💰 ${price}\n\n` +
      `Mau info lengkap atau jadwal survei? Balas pesan ini ya.`,
    facebook:
      `${adj} — ${listing.title} di ${loc}. ${price}. Legalitas aman, siap KPR/survei. ` +
      `Hubungi kami untuk detail lengkap.`,
    hashtags: [
      "properti", `${t.toLowerCase()}dijual`, "rumahidaman", "propertiindonesia",
      loc.split(",")[0]?.toLowerCase().replace(/\s+/g, "") || "rumah", "investasiproperti",
    ],
    ad: {
      headline: `${t} ${adj} ${price}`.slice(0, 40),
      primary: `${listing.title} di ${loc}. Legalitas jelas, harga wajar. Hubungi kami untuk survei.`,
    },
    email: {
      subject: `${adj}: ${listing.title} — ${price}`,
      body:
        `Halo,\n\nKami ingin memperkenalkan ${listing.title} di ${loc} dengan harga ${price}. ` +
        `Properti ini sudah melalui pemeriksaan legalitas dan siap untuk Anda tinjau.\n\n` +
        `Jika tertarik, balas email ini atau hubungi tim kami untuk menjadwalkan survei. Terima kasih.`,
    },
  };
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
