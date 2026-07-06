// Pembuatan deck PowerPoint (.pptx) dari data listing — server-side.
// Desain: bersih, tegas, tanpa tumpang tindih (semua kotak teks dibatasi
// + fit "shrink" agar teks panjang mengecil, bukan meluber).
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
const W = 13.333;
const H = 7.5;

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

  // Header konsisten: aksen + judul. Konten mulai ~y 1.7.
  const header = (s, title) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.62, w: 0.62, h: 0.12, fill: { color: SAND } });
    s.addText(title, { x: 0.6, y: 0.82, w: W - 1.2, h: 0.75, color: INK, fontSize: 28, bold: true });
  };
  const footer = (s, dark) => {
    s.addText(
      [
        { text: "RumahPlus", options: { bold: true, color: dark ? PAPER : INK } },
        { text: `   ·   ${price}`, options: { color: dark ? SAND : PINE, bold: true } },
      ],
      { x: 0.6, y: H - 0.55, w: W - 1.2, h: 0.35, fontSize: 11 }
    );
  };

  // ---------- 1) COVER ----------
  const s1 = pptx.addSlide();
  s1.background = { color: PINE_DK };
  if (imgData[0]) s1.addImage({ data: imgData[0], x: 6.6, y: 0, w: W - 6.6, h: H, sizing: { type: "cover", w: W - 6.6, h: H } });
  s1.addText("RumahPlus", { x: 0.7, y: 0.55, w: 5, h: 0.5, color: PAPER, fontSize: 20, bold: true });
  s1.addShape(pptx.ShapeType.rect, { x: 0.72, y: 1.05, w: 1.15, h: 0.07, fill: { color: SAND } });
  s1.addText(status.toUpperCase(), { x: 0.7, y: 2.05, w: 5.4, h: 0.4, color: SAND, fontSize: 15, bold: true, charSpacing: 4 });
  s1.addText(listing.title || "Properti", { x: 0.7, y: 2.5, w: 5.5, h: 1.7, color: PAPER, fontSize: 32, bold: true, fit: "shrink", valign: "top" });
  s1.addText(where, { x: 0.7, y: 4.35, w: 5.5, h: 0.7, color: "C7D8CE", fontSize: 16, fit: "shrink", valign: "top" });
  s1.addText(price, { x: 0.7, y: 5.15, w: 5.5, h: 0.7, color: PAPER, fontSize: 30, bold: true });

  const strip = [];
  if (listing.bedrooms > 0) strip.push(`${listing.bedrooms} KT`);
  if (listing.bathrooms > 0) strip.push(`${listing.bathrooms} KM`);
  if (listing.carports > 0) strip.push(`${listing.carports} Carport`);
  if (listing.landSize > 0) strip.push(`LT ${listing.landSize} m²`);
  if (listing.buildingSize > 0) strip.push(`LB ${listing.buildingSize} m²`);
  if (strip.length) {
    s1.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 6.15, w: 5.5, h: 0.62, rectRadius: 0.08, fill: { color: "1F3D2E" } });
    s1.addText(strip.join("   ·   "), { x: 0.7, y: 6.15, w: 5.5, h: 0.62, color: "D6E3DC", fontSize: 13, bold: true, align: "center", valign: "middle", fit: "shrink" });
  }

  // ---------- 2) GALERI ----------
  if (imgData.some(Boolean)) {
    const s2 = pptx.addSlide();
    s2.background = { color: PAPER };
    header(s2, "Galeri");
    const spots = [
      { x: 0.6, y: 1.75, w: 5.95, h: 2.55 }, { x: 6.78, y: 1.75, w: 5.95, h: 2.55 },
      { x: 0.6, y: 4.45, w: 3.87, h: 2.4 }, { x: 4.72, y: 4.45, w: 3.87, h: 2.4 }, { x: 8.85, y: 4.45, w: 3.88, h: 2.4 },
    ];
    imgData.slice(0, 5).forEach((d, i) => {
      if (!d || !spots[i]) return;
      const sp = spots[i];
      s2.addImage({ data: d, ...sp, sizing: { type: "cover", w: sp.w, h: sp.h }, rounding: true });
      if (captions[i]) {
        s2.addText(clip(captions[i], 60), {
          x: sp.x, y: sp.y + sp.h - 0.44, w: sp.w, h: 0.44,
          color: PAPER, fontSize: 10.5, bold: true, fill: { color: INK, transparency: 20 }, valign: "middle", align: "center",
        });
      }
    });
  }

  // ---------- 3) SPESIFIKASI ----------
  const s3 = pptx.addSlide();
  s3.background = { color: PAPER };
  header(s3, "Spesifikasi");
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
    ["Tipe", type],
    ["Status", status],
  ].filter(Boolean);
  const half = Math.ceil(specs.length / 2);
  [specs.slice(0, half), specs.slice(half)].forEach((col, ci) => {
    if (!col.length) return;
    const x = 0.6 + ci * 6.35;
    s3.addTable(
      col.map(([k, v], i) => [
        { text: k, options: { color: MUTE, fontSize: 14, bold: true, fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
        { text: String(v), options: { color: INK, fontSize: 14, bold: true, align: "right", fill: { color: i % 2 ? "FFFFFF" : PINE_50 }, valign: "middle" } },
      ]),
      { x, y: 1.75, w: 5.9, colW: [3.7, 2.2], rowH: 0.52, border: { type: "solid", color: "E5E0D8", pt: 0.5 } }
    );
  });
  footer(s3);

  // ---------- 4) LOKASI & SEKITAR ----------
  const ins = listing.locationInsight || {};
  const hasGeo = listing.geo?.lat && listing.geo?.lng;
  if (hasGeo || ins.strategic?.length || ins.nearby?.length) {
    const s4 = pptx.addSlide();
    s4.background = { color: PAPER };
    header(s4, "Lokasi & Sekitar");
    if (where) s4.addText(where, { x: 3.0, y: 0.95, w: W - 3.6, h: 0.5, color: MUTE, fontSize: 13, bold: true, valign: "middle" });

    const RX = hasGeo ? 6.65 : 0.6;
    const RW = hasGeo ? 6.15 : W - 1.2;

    // Peta 2x2 tile OSM + marker (kiri)
    if (hasGeo) {
      const { tiles, marker } = staticMapTiles(listing.geo.lat, listing.geo.lng, 15);
      const tileData = await Promise.all(tiles.map((t) => fetchImageData(t.url)));
      const MAP = { x: 0.6, y: 1.75, w: 5.7, h: 5.2 };
      s4.addShape(pptx.ShapeType.rect, { x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h, fill: { color: "E9E4DB" } });
      tiles.forEach((t, i) => {
        if (tileData[i]) s4.addImage({ data: tileData[i], x: MAP.x + (t.col * MAP.w) / 2, y: MAP.y + (t.row * MAP.h) / 2, w: MAP.w / 2, h: MAP.h / 2 });
      });
      const mx = MAP.x + marker.fx * MAP.w;
      const my = MAP.y + marker.fy * MAP.h;
      s4.addShape(pptx.ShapeType.ellipse, { x: mx - 0.16, y: my - 0.16, w: 0.32, h: 0.32, fill: { color: PINE }, line: { color: PAPER, width: 3 } });
      s4.addText("© OpenStreetMap", { x: MAP.x + 0.05, y: MAP.y + MAP.h - 0.28, w: 2.2, h: 0.25, color: "FFFFFF", fontSize: 8, bold: true });
    }

    // Kolom kanan: strategis (atas) + terdekat (bawah) — zona terpisah, tak menabrak.
    if (ins.strategic?.length) {
      s4.addText("Kenapa strategis", { x: RX, y: 1.75, w: RW, h: 0.4, color: PINE, fontSize: 15, bold: true });
      s4.addText(
        ins.strategic.slice(0, 3).map((t) => ({
          text: clip(t, 105),
          options: { bullet: { characterCode: "2022", indent: 14 }, color: "3A342E", fontSize: 12.5, breakLine: true, paraSpaceAfter: 6 },
        })),
        { x: RX, y: 2.2, w: RW, h: 2.15, valign: "top", fit: "shrink", lineSpacingMultiple: 1.05 }
      );
    }
    if (ins.nearby?.length) {
      s4.addText("Terdekat dari properti", { x: RX, y: 4.5, w: RW, h: 0.4, color: PINE, fontSize: 15, bold: true });
      s4.addTable(
        ins.nearby.slice(0, 6).map((n) => [
          { text: clip(n.name, 42), options: { color: INK, fontSize: 11.5, bold: true, valign: "middle" } },
          { text: n.category || "", options: { color: MUTE, fontSize: 11, valign: "middle" } },
          { text: n.minutes ? `${n.minutes} mnt` : "", options: { color: PINE, fontSize: 11.5, bold: true, align: "right", valign: "middle" } },
        ]),
        { x: RX, y: 4.95, w: RW, colW: [RW * 0.55, RW * 0.27, RW * 0.18], rowH: 0.36, border: { type: "solid", color: "E5E0D8", pt: 0.5 } }
      );
    }
  }

  // ---------- 5) SELLING POINTS ----------
  if (listing.sellingPoints?.length) {
    const s5 = pptx.addSlide();
    s5.background = { color: PINE };
    s5.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.62, w: 0.62, h: 0.12, fill: { color: SAND } });
    s5.addText("Selling Points", { x: 0.6, y: 0.82, w: W - 1.2, h: 0.75, color: PAPER, fontSize: 28, bold: true });

    const sps = listing.sellingPoints.slice(0, 4);
    const cols = 2;
    const gap = 0.35;
    const cw = (W - 1.2 - gap) / cols; // 5.9
    const ch = 2.05;
    sps.forEach((sp, i) => {
      const x = 0.6 + (i % cols) * (cw + gap);
      const y = 1.75 + Math.floor(i / cols) * (ch + 0.3);
      s5.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: PINE_DK } });
      s5.addText(clip(sp.aspect, 26).toUpperCase(), { x: x + 0.3, y: y + 0.22, w: cw - 0.6, h: 0.35, color: "8FB59D", fontSize: 11, bold: true, charSpacing: 2 });
      s5.addText(clip(sp.point, 70), { x: x + 0.3, y: y + 0.6, w: cw - 0.6, h: 0.6, color: PAPER, fontSize: 14.5, bold: true, valign: "top", fit: "shrink" });
      s5.addText(clip(sp.detail, 130), { x: x + 0.3, y: y + 1.25, w: cw - 0.6, h: 0.68, color: "C7D8CE", fontSize: 11, valign: "top", fit: "shrink", lineSpacingMultiple: 1.05 });
    });
    if (listing.targetBuyers?.length) {
      s5.addText(
        [
          { text: "Paling cocok:  ", options: { bold: true, color: SAND } },
          { text: clip(listing.targetBuyers.map((t) => t.split("—")[0].trim()).join("   ·   "), 130), options: { color: "E8F0EB" } },
        ],
        { x: 0.6, y: 6.75, w: W - 1.2, h: 0.5, fontSize: 12, valign: "middle", fit: "shrink" }
      );
    }
  }

  // ---------- 6) DESKRIPSI ----------
  if (listing.description) {
    const s6 = pptx.addSlide();
    s6.background = { color: PAPER };
    header(s6, "Tentang Properti");
    s6.addText(listing.description, { x: 0.6, y: 1.75, w: W - 1.2, h: 5.0, color: "3A342E", fontSize: 14, lineSpacingMultiple: 1.3, valign: "top", fit: "shrink", paraSpaceAfter: 10 });
    footer(s6);
  }

  // ---------- 7) KONTAK ----------
  const s7 = pptx.addSlide();
  s7.background = { color: PINE_DK };
  s7.addShape(pptx.ShapeType.rect, { x: 0.7, y: 2.35, w: 1.15, h: 0.09, fill: { color: SAND } });
  s7.addText("Tertarik dengan properti ini?", { x: 0.7, y: 2.6, w: W - 1.4, h: 0.8, color: PAPER, fontSize: 30, bold: true });
  const ag = listing.agent || {};
  s7.addText(
    [
      { text: (ag.name || SITE.name) + "\n", options: { fontSize: 20, bold: true, color: PAPER } },
      { text: (ag.company || "RumahPlus Curated") + "\n", options: { fontSize: 15, color: "C7D8CE" } },
      { text: (ag.phone || SITE.phone) + "   ·   " + SITE.email, options: { fontSize: 17, color: SAND, bold: true } },
    ],
    { x: 0.7, y: 3.7, w: W - 1.4, h: 2, lineSpacingMultiple: 1.2 }
  );

  return pptx.write({ outputType: "base64" });
}
