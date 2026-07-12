// Pembuatan deck PowerPoint (.pptx) dari data listing — server-side.
// Desain "listing presentation" premium: hirarki tegas, aksen sand,
// stat tiles, galeri membulat, peta, selling points berkartu, QR kontak.
// Semua kotak teks dibatasi + fit "shrink" agar tidak pernah meluber.
import fs from "fs";
import path from "path";
import PptxGenJS from "pptxgenjs";
import { formatPrice, kprMonthly } from "@/lib/utils";
import { TYPE_LABELS, SITE } from "@/data";
import { staticMapTiles } from "@/lib/geo";
import { findComparables, priceStats } from "@/lib/cma";
import { allListings, getBrand } from "@/lib/store";

const fmtRp = (n) => (n ? "Rp " + Math.round(n).toLocaleString("id-ID") : "-");

const INK = "171311";
const PAPER = "F7F4EE";
const PINE = "214735";
const PINE_DK = "152D22";
const PINE_50 = "EAF1EC";
const MUTE = "6C6459";
const SAND = "B08A4F";
const SAND_LT = "E2CCA8";
const W = 13.333;
const H = 7.5;
const MX = 0.7; // margin kiri/kanan

async function fetchImageData(url) {
  try {
    if (url.startsWith("/")) {
      const p = path.join(process.cwd(), "public", url);
      const buf = fs.readFileSync(p);
      const ext = path.extname(p).slice(1) || "jpeg";
      return `image/${ext === "jpg" ? "jpeg" : ext};base64,${buf.toString("base64")}`;
    }
    const res = await fetch(url, { headers: { "User-Agent": "RumahPlus/1.0" } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "image/jpeg";
    return `${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function clip(s, max) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 40 ? cut.slice(0, sp) : cut) + "…";
}

export async function buildDeckBase64(listing) {
  const brand = getBrand();
  const brandName = listing.brandName || brand.brandName || SITE.name;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: W, height: H });
  pptx.layout = "WIDE";
  pptx.author = brandName;

  const price = formatPrice(Number(listing.price), listing.listing, listing.priceUnit);
  const type = TYPE_LABELS[listing.type] || "Properti";
  const status = listing.listing === "sewa" ? "Disewakan" : "Dijual";
  const where = [listing.cluster, listing.location].filter(Boolean).join(" · ");
  const images = (listing.images || []).slice(0, 6);
  const captions = listing.photoCaptions || [];
  const imgData = await Promise.all(images.map(fetchImageData));
  const pageUrl = `${SITE.url}/properti/${listing.slug || ""}`;

  let pageNo = 0;
  // Kerangka halaman konsisten: aksen, judul besar, subjudul, nomor halaman.
  const header = (s, title, subtitle) => {
    pageNo++;
    s.addShape(pptx.ShapeType.rect, { x: MX, y: 0.66, w: 0.72, h: 0.13, fill: { color: SAND } });
    s.addText(title, { x: MX, y: 0.86, w: W - MX * 2 - 1.2, h: 0.78, color: INK, fontSize: 30, bold: true });
    if (subtitle) s.addText(subtitle, { x: MX, y: 1.56, w: W - MX * 2, h: 0.4, color: MUTE, fontSize: 13, bold: true });
    s.addText(String(pageNo).padStart(2, "0"), { x: W - 1.3, y: 0.7, w: 0.7, h: 0.5, color: SAND, fontSize: 18, bold: true, align: "right" });
    s.addText(
      [
        { text: brandName, options: { bold: true, color: INK } },
        { text: `  ·  ${clip(listing.title, 60)}  ·  `, options: { color: MUTE } },
        { text: price, options: { color: PINE, bold: true } },
      ],
      { x: MX, y: H - 0.5, w: W - MX * 2, h: 0.32, fontSize: 10.5 }
    );
  };

  // ---------- 1) COVER ----------
  {
    const s = pptx.addSlide();
    s.background = { color: PINE_DK };
    const coverData = imgData.find(Boolean); // foto pertama yang berhasil dimuat
    if (coverData) {
      s.addImage({ data: coverData, x: 6.3, y: 0, w: W - 6.3, h: H, sizing: { type: "cover", w: W - 6.3, h: H } });
      // panel gradasi tipis pemisah
      s.addShape(pptx.ShapeType.rect, { x: 6.3, y: 0, w: 0.14, h: H, fill: { color: SAND } });
    }
    s.addText(brandName, { x: MX, y: 0.55, w: 5, h: 0.5, color: PAPER, fontSize: 21, bold: true });
    s.addText("PROPERTI TERKURASI", { x: MX, y: 1.02, w: 5, h: 0.3, color: "8FB59D", fontSize: 10, bold: true, charSpacing: 3 });

    // pill status
    s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 2.0, w: 1.9, h: 0.52, rectRadius: 0.26, fill: { color: SAND } });
    s.addText(status.toUpperCase(), { x: MX, y: 2.0, w: 1.9, h: 0.52, color: INK, fontSize: 14, bold: true, align: "center", valign: "middle", charSpacing: 2 });

    s.addText(listing.title || "Properti", { x: MX, y: 2.7, w: 5.35, h: 1.75, color: PAPER, fontSize: 33, bold: true, valign: "top", fit: "shrink" });
    s.addText(where, { x: MX, y: 4.5, w: 5.3, h: 0.6, color: "C7D8CE", fontSize: 15, bold: true, valign: "top", fit: "shrink" });

    // harga di panel sand
    s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 5.25, w: 5.35, h: 1.0, rectRadius: 0.12, fill: { color: "1F3D2E" } });
    s.addText(
      [
        { text: "HARGA  ", options: { color: "8FB59D", fontSize: 11, bold: true, charSpacing: 2 } },
        { text: price, options: { color: PAPER, fontSize: 28, bold: true } },
      ],
      { x: MX + 0.25, y: 5.25, w: 4.9, h: 1.0, valign: "middle" }
    );

    const strip = [];
    if (listing.bedrooms > 0) strip.push(`${listing.bedrooms} KT`);
    if (listing.bathrooms > 0) strip.push(`${listing.bathrooms} KM`);
    if (listing.carports > 0) strip.push(`${listing.carports} Carport`);
    if (listing.landSize > 0) strip.push(`LT ${listing.landSize} m²`);
    if (listing.buildingSize > 0) strip.push(`LB ${listing.buildingSize} m²`);
    if (strip.length) {
      s.addText(strip.join("    ·    "), { x: MX, y: 6.5, w: 5.35, h: 0.5, color: SAND_LT, fontSize: 13, bold: true, fit: "shrink" });
    }
  }

  // ---------- 2) SOROTAN (stat tiles + highlights) ----------
  {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Sorotan Utama", where);

    const tiles = [
      ["Harga", price],
      listing.landSize > 0 && ["Luas Tanah", `${listing.landSize} m²`],
      listing.buildingSize > 0 && ["Luas Bangunan", `${listing.buildingSize} m²`],
      (listing.bedrooms > 0 || listing.bathrooms > 0) && ["Kamar", `${listing.bedrooms || 0} KT · ${listing.bathrooms || 0} KM`],
      listing.certificate && ["Legalitas", listing.certificate + (listing.imb ? " + IMB" : "")],
    ].filter(Boolean).slice(0, 5);
    const tw = (W - MX * 2 - 0.3 * (tiles.length - 1)) / tiles.length;
    tiles.forEach(([k, v], i) => {
      const x = MX + i * (tw + 0.3);
      s.addShape(pptx.ShapeType.roundRect, { x, y: 2.15, w: tw, h: 1.5, rectRadius: 0.1, fill: { color: i === 0 ? PINE : "FFFFFF" }, line: { color: i === 0 ? PINE : "E5E0D8", width: 1 } });
      s.addText(k.toUpperCase(), { x: x + 0.15, y: 2.32, w: tw - 0.3, h: 0.3, color: i === 0 ? "8FB59D" : MUTE, fontSize: 10, bold: true, charSpacing: 1.5 });
      s.addText(String(v), { x: x + 0.15, y: 2.62, w: tw - 0.3, h: 0.85, color: i === 0 ? PAPER : INK, fontSize: 17, bold: true, valign: "middle", fit: "shrink" });
    });

    const his = (listing.highlights || []).slice(0, 6);
    if (his.length) {
      s.addText("Yang membuat properti ini menonjol", { x: MX, y: 4.1, w: W - MX * 2, h: 0.45, color: PINE, fontSize: 16, bold: true });
      const colW = (W - MX * 2 - 0.4) / 2;
      his.forEach((t, i) => {
        const x = MX + (i % 2) * (colW + 0.4);
        const y = 4.65 + Math.floor(i / 2) * 0.72;
        s.addShape(pptx.ShapeType.roundRect, { x, y, w: colW, h: 0.6, rectRadius: 0.08, fill: { color: PINE_50 } });
        s.addText([{ text: "✓  ", options: { color: PINE, bold: true } }, { text: clip(t, 70), options: { color: "3A342E", bold: true } }], {
          x: x + 0.2, y, w: colW - 0.4, h: 0.6, fontSize: 12.5, valign: "middle", fit: "shrink",
        });
      });
    }
  }

  // ---------- 3) GALERI ----------
  if (imgData.some(Boolean)) {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Galeri", `${images.length} foto properti`);
    const spots = [
      { x: MX, y: 2.05, w: 5.9, h: 2.5 }, { x: 6.83, y: 2.05, w: 5.8, h: 2.5 },
      { x: MX, y: 4.7, w: 3.83, h: 2.2 }, { x: 4.73, y: 4.7, w: 3.83, h: 2.2 }, { x: 8.8, y: 4.7, w: 3.83, h: 2.2 },
    ];
    // foto yang gagal dimuat dibuang; caption tetap menempel ke fotonya
    const pairs = imgData.map((d, i) => ({ d, cap: captions[i] })).filter((p) => p.d).slice(0, 5);
    pairs.forEach((p, i) => {
      const sp = spots[i];
      if (!sp) return;
      s.addImage({ data: p.d, ...sp, sizing: { type: "cover", w: sp.w, h: sp.h }, rounding: true });
      if (p.cap) {
        s.addShape(pptx.ShapeType.roundRect, { x: sp.x + 0.12, y: sp.y + sp.h - 0.52, w: sp.w - 0.24, h: 0.4, rectRadius: 0.06, fill: { color: INK, transparency: 18 } });
        s.addText(clip(p.cap, 55), { x: sp.x + 0.2, y: sp.y + sp.h - 0.52, w: sp.w - 0.4, h: 0.4, color: PAPER, fontSize: 10, bold: true, valign: "middle", fit: "shrink" });
      }
    });
  }

  // ---------- 4) SPESIFIKASI ----------
  {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Spesifikasi Lengkap", `${type} · ${status}`);
    const specs = [
      listing.bedrooms > 0 && ["Kamar Tidur", `${listing.bedrooms}`],
      listing.bathrooms > 0 && ["Kamar Mandi", `${listing.bathrooms}`],
      listing.carports > 0 && ["Carport", `${listing.carports}`],
      listing.landSize > 0 && ["Luas Tanah", `${listing.landSize} m²`],
      listing.buildingSize > 0 && ["Luas Bangunan", `${listing.buildingSize} m²`],
      listing.floors > 0 && ["Jumlah Lantai", `${listing.floors}`],
      listing.yearBuilt && ["Tahun Bangun", `${listing.yearBuilt}`],
      listing.electricity && ["Listrik", `${listing.electricity} VA`],
      listing.water && ["Air", listing.water],
      listing.facing && ["Hadap", listing.facing],
      listing.furnished && ["Furnitur", listing.furnished],
      listing.condition && ["Kondisi", listing.condition],
      listing.maidRooms > 0 && ["Kamar Pembantu", `${listing.maidRooms}`],
      listing.garage > 0 && ["Garasi", `${listing.garage}`],
      listing.ipl && ["IPL / Bulan", `Rp ${Number(listing.ipl).toLocaleString("id-ID")}`],
      listing.roadWidth && ["Row Jalan", `${listing.roadWidth} mobil`],
      listing.certificate && ["Sertifikat", listing.certificate],
      listing.imb && ["IMB / PBG", "Ada"],
      listing.facilities?.length && ["Fasilitas", listing.facilities.slice(0, 5).join(" · ")],
    ].filter(Boolean);
    const half = Math.ceil(specs.length / 2);
    [specs.slice(0, half), specs.slice(half)].forEach((col, ci) => {
      if (!col.length) return;
      const x = MX + ci * ((W - MX * 2) / 2 + 0.15);
      s.addTable(
        col.map(([k, v], i) => [
          { text: k, options: { color: MUTE, fontSize: 13.5, bold: true, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
          { text: String(v), options: { color: INK, fontSize: 13.5, bold: true, align: "right", fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
        ]),
        { x, y: 2.05, w: (W - MX * 2) / 2 - 0.15, colW: [(W - MX * 2) / 4 + 0.4, (W - MX * 2) / 4 - 0.55], rowH: 0.5, border: { type: "solid", color: "E5E0D8", pt: 0.5 } }
      );
    });
  }

  // ---------- 5) LOKASI & SEKITAR ----------
  const ins = listing.locationInsight || {};
  const hasGeo = listing.geo?.lat && listing.geo?.lng;
  if (hasGeo || ins.strategic?.length || ins.nearby?.length) {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Lokasi & Sekitar", where);

    const RX = hasGeo ? 6.75 : MX;
    const RW = hasGeo ? W - 6.75 - MX : W - MX * 2;

    if (hasGeo) {
      const { tiles, marker } = staticMapTiles(listing.geo.lat, listing.geo.lng, 15);
      const tileData = await Promise.all(tiles.map((t) => fetchImageData(t.url)));
      const MAP = { x: MX, y: 2.05, w: 5.7, h: 4.85 };
      s.addShape(pptx.ShapeType.rect, { x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h, fill: { color: "E9E4DB" } });
      tiles.forEach((t, i) => {
        if (tileData[i]) s.addImage({ data: tileData[i], x: MAP.x + (t.col * MAP.w) / 2, y: MAP.y + (t.row * MAP.h) / 2, w: MAP.w / 2, h: MAP.h / 2 });
      });
      const mx = MAP.x + marker.fx * MAP.w;
      const my = MAP.y + marker.fy * MAP.h;
      s.addShape(pptx.ShapeType.ellipse, { x: mx - 0.17, y: my - 0.17, w: 0.34, h: 0.34, fill: { color: PINE }, line: { color: PAPER, width: 3 } });
      s.addText("© OpenStreetMap", { x: MAP.x + 0.06, y: MAP.y + MAP.h - 0.28, w: 2.2, h: 0.24, color: "FFFFFF", fontSize: 8, bold: true });
    }

    if (ins.strategic?.length) {
      s.addText("Kenapa strategis", { x: RX, y: 2.05, w: RW, h: 0.4, color: PINE, fontSize: 15, bold: true });
      s.addText(
        ins.strategic.slice(0, 3).map((t) => ({
          text: clip(t, 100),
          options: { bullet: { characterCode: "2022", indent: 14 }, color: "3A342E", fontSize: 12, breakLine: true, paraSpaceAfter: 6 },
        })),
        { x: RX, y: 2.5, w: RW, h: 1.95, valign: "top", fit: "shrink", lineSpacingMultiple: 1.05 }
      );
    }
    if (ins.nearby?.length) {
      s.addText("Terdekat dari properti", { x: RX, y: 4.6, w: RW, h: 0.4, color: PINE, fontSize: 15, bold: true });
      s.addTable(
        ins.nearby.slice(0, 6).map((n) => [
          { text: clip(n.name, 40), options: { color: INK, fontSize: 11, bold: true, valign: "middle" } },
          { text: n.minutes ? `${n.minutes} mnt` : "", options: { color: PINE, fontSize: 11, bold: true, align: "right", valign: "middle" } },
        ]),
        { x: RX, y: 5.02, w: RW, colW: [RW * 0.78, RW * 0.22], rowH: 0.32, border: { type: "solid", color: "E5E0D8", pt: 0.5 } }
      );
    }
  }

  // ---------- 6) SELLING POINTS ----------
  if (listing.sellingPoints?.length) {
    const s = pptx.addSlide();
    s.background = { color: PINE };
    pageNo++;
    s.addShape(pptx.ShapeType.rect, { x: MX, y: 0.66, w: 0.72, h: 0.13, fill: { color: SAND } });
    s.addText("Kenapa Properti Ini Layak", { x: MX, y: 0.86, w: W - MX * 2 - 1, h: 0.78, color: PAPER, fontSize: 30, bold: true });
    s.addText(String(pageNo).padStart(2, "0"), { x: W - 1.3, y: 0.7, w: 0.7, h: 0.5, color: SAND, fontSize: 18, bold: true, align: "right" });

    const sps = listing.sellingPoints.slice(0, 4);
    const gap = 0.35;
    const cw = (W - MX * 2 - gap) / 2;
    const ch = 2.1;
    sps.forEach((sp, i) => {
      const x = MX + (i % 2) * (cw + gap);
      const y = 1.85 + Math.floor(i / 2) * (ch + 0.3);
      s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: PINE_DK } });
      s.addShape(pptx.ShapeType.rect, { x, y: y + 0.25, w: 0.09, h: ch - 0.5, fill: { color: SAND } });
      s.addText(clip(sp.aspect, 26).toUpperCase(), { x: x + 0.32, y: y + 0.22, w: cw - 0.6, h: 0.32, color: "8FB59D", fontSize: 10.5, bold: true, charSpacing: 2 });
      s.addText(clip(sp.point, 70), { x: x + 0.32, y: y + 0.58, w: cw - 0.6, h: 0.62, color: PAPER, fontSize: 15, bold: true, valign: "top", fit: "shrink" });
      s.addText(clip(sp.detail, 135), { x: x + 0.32, y: y + 1.25, w: cw - 0.6, h: 0.75, color: "C7D8CE", fontSize: 11, valign: "top", fit: "shrink", lineSpacingMultiple: 1.08 });
    });
    if (listing.targetBuyers?.length) {
      s.addText(
        [
          { text: "PALING COCOK UNTUK   ", options: { bold: true, color: SAND, charSpacing: 2, fontSize: 10 } },
          { text: clip(listing.targetBuyers.map((t) => t.split("—")[0].trim()).join("   ·   "), 125), options: { color: "E8F0EB", fontSize: 12 } },
        ],
        { x: MX, y: 6.65, w: W - MX * 2, h: 0.5, valign: "middle", fit: "shrink" }
      );
    }
  }

  // ---------- 7) SIMULASI KPR (materi wajib deck properti jual) ----------
  if (listing.listing !== "sewa" && Number(listing.price) > 100_000_000) {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Simulasi KPR", "Asumsi bunga 8%/tahun (fixed) — konfirmasi ke bank pilihan Anda");
    const P = Number(listing.price);
    const rows = [10, 20, 30].map((dpPct) => {
      const loan = P * (1 - dpPct / 100);
      return [dpPct, P * (dpPct / 100), loan, kprMonthly(loan, 8, 15), kprMonthly(loan, 8, 20)];
    });
    // headline "mulai dari"
    const cheapest = Math.min(...rows.map((r) => r[4]));
    s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 2.05, w: W - MX * 2, h: 1.1, rectRadius: 0.12, fill: { color: PINE } });
    s.addText(
      [
        { text: "CICILAN MULAI DARI   ", options: { color: "8FB59D", fontSize: 12, bold: true, charSpacing: 2 } },
        { text: `${fmtRp(cheapest)} / bulan`, options: { color: PAPER, fontSize: 26, bold: true } },
        { text: "   (DP 30% · tenor 20 tahun)", options: { color: SAND_LT, fontSize: 12 } },
      ],
      { x: MX + 0.3, y: 2.05, w: W - MX * 2 - 0.6, h: 1.1, valign: "middle" }
    );
    s.addTable(
      [
        ["DP", "Uang Muka", "Pinjaman", "Cicilan 15 th", "Cicilan 20 th"].map((t) => ({
          text: t, options: { color: PAPER, fontSize: 13, bold: true, fill: { color: PINE_DK }, valign: "middle" },
        })),
        ...rows.map(([dp, dpRp, loan, c15, c20], i) => [
          { text: `${dp}%`, options: { color: INK, bold: true, fontSize: 13, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
          { text: fmtRp(dpRp), options: { color: INK, fontSize: 13, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
          { text: fmtRp(loan), options: { color: INK, fontSize: 13, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
          { text: fmtRp(c15) + "/bln", options: { color: PINE, bold: true, fontSize: 13, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
          { text: fmtRp(c20) + "/bln", options: { color: PINE, bold: true, fontSize: 13, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
        ]),
      ],
      { x: MX, y: 3.45, w: W - MX * 2, colW: [1.2, 2.9, 2.9, 2.5, 2.43], rowH: 0.62, border: { type: "solid", color: "E5E0D8", pt: 0.5 } }
    );
    s.addText("Simulasi indikatif, bukan penawaran kredit. Suku bunga & persyaratan mengikuti kebijakan bank.", { x: MX, y: 6.35, w: W - MX * 2, h: 0.4, color: MUTE, fontSize: 10.5, italic: true });
  }

  // ---------- 8) ANALISIS HARGA vs PASAR (data pembanding area) ----------
  try {
    const comps = findComparables(listing, allListings({ publishedOnly: true }));
    if (comps.length >= 2) {
      const st = priceStats(listing, comps);
      if (st.stats.medianPpsqm && st.subPpsqm) {
        const s = pptx.addSlide();
        s.background = { color: PAPER };
        header(s, "Posisi Harga di Pasar", `Berdasarkan ${st.stats.count} pembanding aktif di area yang sama`);
        // dua bar: median area vs properti ini
        const maxV = Math.max(st.stats.medianPpsqm, st.subPpsqm) * 1.15;
        const bars = [
          ["Median area", st.stats.medianPpsqm, MUTE],
          ["Properti ini", st.subPpsqm, PINE],
        ];
        bars.forEach(([label, v, color], i) => {
          const y = 2.35 + i * 1.15;
          const bw = ((W - MX * 2 - 3.4) * v) / maxV;
          s.addText(label, { x: MX, y, w: 2.1, h: 0.7, color: INK, fontSize: 13, bold: true, valign: "middle" });
          s.addShape(pptx.ShapeType.roundRect, { x: MX + 2.2, y: y + 0.08, w: Math.max(bw, 0.6), h: 0.54, rectRadius: 0.08, fill: { color } });
          s.addText(`${fmtRp(v)}/m²`, { x: MX + 2.3 + Math.max(bw, 0.6), y, w: 2.6, h: 0.7, color: INK, fontSize: 13, bold: true, valign: "middle" });
        });
        const diff = st.vsMedian;
        s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 4.9, w: W - MX * 2, h: 1.35, rectRadius: 0.12, fill: { color: PINE_50 } });
        s.addText(
          diff == null
            ? "Data pembanding menempatkan harga pada kisaran pasar area."
            : diff > 8
            ? `Harga ${diff}% di atas median area — premium yang didukung kondisi & kelengkapan unit ini.`
            : diff < -8
            ? `Harga ${Math.abs(diff)}% di bawah median area — peluang nilai terbaik bagi pembeli.`
            : "Harga berada di kisaran wajar pasar area — didukung data pembanding aktif.",
          { x: MX + 0.3, y: 4.9, w: W - MX * 2 - 0.6, h: 1.35, color: INK, fontSize: 16, bold: true, valign: "middle", fit: "shrink" }
        );
        s.addText(`Rentang pembanding: ${fmtRp(st.stats.minPpsqm)} – ${fmtRp(st.stats.maxPpsqm)} per m².`, { x: MX, y: 6.45, w: W - MX * 2, h: 0.4, color: MUTE, fontSize: 11 });
      }
    }
  } catch {}

  // ---------- 9) PROSES & BIAYA PEMBELIAN ----------
  if (listing.listing !== "sewa") {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Proses & Estimasi Biaya", "Kami dampingi dari survei sampai serah terima");
    const steps = [
      ["1. Survei", "Kunjungan unit & cek lingkungan bersama agen"],
      ["2. Booking & Nego", "Tanda jadi + negosiasi harga berbasis data"],
      ["3. PPJB / Akad KPR", "Perjanjian & proses bank (kami bantu dokumen)"],
      ["4. AJB & Serah Terima", "Balik nama di PPAT, kunci diserahkan"],
    ];
    const sw = (W - MX * 2 - 0.9) / 4;
    steps.forEach(([t, d], i) => {
      const x = MX + i * (sw + 0.3);
      s.addShape(pptx.ShapeType.roundRect, { x, y: 2.05, w: sw, h: 1.75, rectRadius: 0.1, fill: { color: i === 3 ? PINE : "FFFFFF" }, line: { color: i === 3 ? PINE : "E5E0D8", width: 1 } });
      s.addText(t, { x: x + 0.18, y: 2.2, w: sw - 0.36, h: 0.45, color: i === 3 ? PAPER : PINE, fontSize: 14, bold: true });
      s.addText(d, { x: x + 0.18, y: 2.68, w: sw - 0.36, h: 1.0, color: i === 3 ? "C7D8CE" : "4B443D", fontSize: 10.5, valign: "top", fit: "shrink", lineSpacingMultiple: 1.1 });
    });
    s.addText("Estimasi biaya di luar harga (ditanggung pembeli)", { x: MX, y: 4.15, w: W - MX * 2, h: 0.4, color: PINE, fontSize: 15, bold: true });
    const P = Number(listing.price) || 0;
    s.addTable(
      [
        ["BPHTB (±5% dari NPOP–NPOPTKP)", P ? `± ${fmtRp(P * 0.05)}` : "±5%"],
        ["Jasa Notaris/PPAT & AJB (±1%)", P ? `± ${fmtRp(P * 0.01)}` : "±1%"],
        ["Biaya KPR: provisi, appraisal, asuransi (±1%)", P ? `± ${fmtRp(P * 0.01)}` : "±1%"],
        ["Balik nama sertifikat", "sesuai tarif BPN"],
      ].map(([k, v], i) => [
        { text: k, options: { color: INK, fontSize: 12.5, bold: true, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
        { text: v, options: { color: PINE, fontSize: 12.5, bold: true, align: "right", fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
      ]),
      { x: MX, y: 4.6, w: W - MX * 2, colW: [(W - MX * 2) * 0.72, (W - MX * 2) * 0.28], rowH: 0.46, border: { type: "solid", color: "E5E0D8", pt: 0.5 } }
    );
    s.addText("Angka indikatif untuk perencanaan — nilai final mengikuti NJOP, wilayah, dan bank.", { x: MX, y: 6.6, w: W - MX * 2, h: 0.35, color: MUTE, fontSize: 10, italic: true });
  }

  // ---------- 10) TENTANG ----------
  if (listing.description) {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    header(s, "Tentang Properti", null);
    s.addText(listing.description, { x: MX, y: 1.85, w: W - MX * 2, h: 4.9, color: "3A342E", fontSize: 13.5, lineSpacingMultiple: 1.32, valign: "top", fit: "shrink", paraSpaceAfter: 10 });
  }

  // ---------- 8) PENUTUP + QR ----------
  {
    const s = pptx.addSlide();
    s.background = { color: PINE_DK };
    s.addShape(pptx.ShapeType.rect, { x: MX, y: 2.05, w: 1.15, h: 0.1, fill: { color: SAND } });
    s.addText("Jadwalkan survei sekarang", { x: MX, y: 2.3, w: 8.2, h: 1.4, color: PAPER, fontSize: 32, bold: true, fit: "shrink" });
    const ag = listing.agent || {};
    const contactLine = [ag.phone || brand.agentPhone, ag.email || brand.agentEmail].filter(Boolean).join("   ·   ");
    s.addText(
      [
        { text: (ag.name || brand.agentName || brandName) + "\n", options: { fontSize: 19, bold: true, color: PAPER } },
        { text: (ag.company || brand.agentCompany || brandName) + "\n", options: { fontSize: 14, color: "C7D8CE" } },
        { text: contactLine || " ", options: { fontSize: 16, color: SAND, bold: true } },
      ],
      { x: MX, y: 3.85, w: 8, h: 1.9, lineSpacingMultiple: 1.25 }
    );
    // QR ke halaman listing (gagal senyap bila offline)
    const qr = await fetchImageData(`https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=8&data=${encodeURIComponent(pageUrl)}`);
    if (qr) {
      s.addShape(pptx.ShapeType.roundRect, { x: 9.55, y: 2.15, w: 3.0, h: 3.55, rectRadius: 0.14, fill: { color: PAPER } });
      s.addImage({ data: qr, x: 9.85, y: 2.42, w: 2.4, h: 2.4 });
      s.addText("Scan untuk halaman\nlengkap & galeri", { x: 9.7, y: 4.85, w: 2.7, h: 0.7, color: INK, fontSize: 11, bold: true, align: "center" });
    }
  }

  return pptx.write({ outputType: "base64" });
}
