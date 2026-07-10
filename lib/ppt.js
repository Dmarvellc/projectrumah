// Pembuatan deck PowerPoint (.pptx) dari data listing — server-side.
// Desain "listing presentation" premium: hirarki tegas, aksen sand,
// stat tiles, galeri membulat, peta, selling points berkartu, QR kontak.
// Semua kotak teks dibatasi + fit "shrink" agar tidak pernah meluber.
import fs from "fs";
import path from "path";
import PptxGenJS from "pptxgenjs";
import { formatPrice } from "@/lib/utils";
import { TYPE_LABELS, SITE } from "@/data";
import { staticMapTiles } from "@/lib/geo";

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
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: W, height: H });
  pptx.layout = "WIDE";
  pptx.author = SITE.name;

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
        { text: "RumahPlus", options: { bold: true, color: INK } },
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
    if (imgData[0]) {
      s.addImage({ data: imgData[0], x: 6.3, y: 0, w: W - 6.3, h: H, sizing: { type: "cover", w: W - 6.3, h: H } });
      // panel gradasi tipis pemisah
      s.addShape(pptx.ShapeType.rect, { x: 6.3, y: 0, w: 0.14, h: H, fill: { color: SAND } });
    }
    s.addText("RumahPlus", { x: MX, y: 0.55, w: 5, h: 0.5, color: PAPER, fontSize: 21, bold: true });
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
    imgData.slice(0, 5).forEach((d, i) => {
      if (!d || !spots[i]) return;
      const sp = spots[i];
      s.addImage({ data: d, ...sp, sizing: { type: "cover", w: sp.w, h: sp.h }, rounding: true });
      if (captions[i]) {
        s.addShape(pptx.ShapeType.roundRect, { x: sp.x + 0.12, y: sp.y + sp.h - 0.52, w: sp.w - 0.24, h: 0.4, rectRadius: 0.06, fill: { color: INK, transparency: 18 } });
        s.addText(clip(captions[i], 55), { x: sp.x + 0.2, y: sp.y + sp.h - 0.52, w: sp.w - 0.4, h: 0.4, color: PAPER, fontSize: 10, bold: true, valign: "middle", fit: "shrink" });
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
      listing.certificate && ["Sertifikat", listing.certificate],
      listing.imb && ["IMB / PBG", "Ada"],
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

  // ---------- 7) TENTANG ----------
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
    s.addText(
      [
        { text: (ag.name || SITE.name) + "\n", options: { fontSize: 19, bold: true, color: PAPER } },
        { text: (ag.company || "RumahPlus Curated") + "\n", options: { fontSize: 14, color: "C7D8CE" } },
        { text: (ag.phone || SITE.phone) + "   ·   " + SITE.email, options: { fontSize: 16, color: SAND, bold: true } },
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
