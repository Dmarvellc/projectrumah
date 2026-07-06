// Pemilihan gambar & pembuatan cover bermerek.
// Catatan: stack ini tidak menghasilkan foto fotorealistik dari nol.
// Sebagai gantinya kami memilih foto stok relevan (Unsplash) berdasarkan
// tipe/kata kunci, dan membuat "cover card" bermerek sebagai aset marketing.

import { formatPrice } from "@/lib/utils";
import { TYPE_LABELS } from "@/data";

const POOLS = {
  rumah: [
    "photo-1568605114967-8130f3a36994",
    "photo-1570129477492-45c003edd2be",
    "photo-1600585154340-be6161a56a0c",
    "photo-1564013799919-ab600027ffc6",
    "photo-1605276374104-dee2a0ed3cd6",
    "photo-1583608205776-bfd35f0d9f83",
  ],
  apartemen: [
    "photo-1545324418-cc1a3fa10c00",
    "photo-1502672260266-1c1ef2d93688",
    "photo-1522708323590-d24dbb6b0267",
    "photo-1600607687939-ce8a6c25118c",
    "photo-1600566753086-00f18fb6b3ea",
  ],
  tanah: [
    "photo-1500382017468-9049fed747ef",
    "photo-1416879595882-3373a0480b5b",
    "photo-1441974231531-c6227db76b6e",
  ],
  ruko: [
    "photo-1497366216548-37526070297c",
    "photo-1497366811353-6870744d04b2",
    "photo-1586528116311-ad8dd3c8310d",
  ],
};

// Gambar editorial untuk artikel, per kategori.
const ARTICLE_POOLS = {
  "Tips & Panduan": [
    "photo-1560518883-ce09059eeffa",
    "photo-1554224155-6726b3ff858f",
    "photo-1560520653-9e0e4c89eb11",
    "photo-1449844908441-8829872d2607",
    "photo-1523217582562-09d0def993a6",
  ],
  "Analisis Pasar": [
    "photo-1460925895917-afdab827c52f",
    "photo-1590283603385-17ffb3a7f29f",
    "photo-1611974789855-9c2a0a7236a3",
    "photo-1486406146926-c627a92ad1ab",
  ],
  Investasi: [
    "photo-1450101499163-c8848c66ca85",
    "photo-1553729459-efe14ef6055d",
    "photo-1579621970563-ebec7560ff3e",
    "photo-1560472354-b33ff0c44a43",
  ],
  "Gaya Hidup": [
    "photo-1583608205776-bfd35f0d9f83",
    "photo-1616486338812-3dadae4b4ace",
    "photo-1600210492486-724fe5c67fb0",
    "photo-1600607687920-4e2a09cf159d",
  ],
};

export function suggestArticleImages(category, count = 3) {
  const pool = ARTICLE_POOLS[category] || ARTICLE_POOLS["Tips & Panduan"];
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((id) => `https://images.unsplash.com/${id}?w=1400&q=80`);
}

export function suggestImages(type, count = 3) {
  const pool = POOLS[type] || POOLS.rumah;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((id) => `https://images.unsplash.com/${id}?w=1200&q=80`);
}

function esc(s) {
  return String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

// Cover marketing bermerek (1200x1200, cocok untuk feed sosial).
export function buildCoverSvg(listing) {
  const price = formatPrice(Number(listing.price), listing.listing, listing.priceUnit);
  const type = TYPE_LABELS[listing.type] || "Properti";
  const status = listing.listing === "sewa" ? "DISEWAKAN" : "DIJUAL";
  const title = esc(listing.title || "Properti Pilihan");
  const loc = esc(listing.location || "");
  const img = listing.images?.[0] || suggestImages(listing.type, 1)[0];

  const titleLines = wrap(title, 26).slice(0, 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <clipPath id="round"><rect x="0" y="0" width="1200" height="1200" rx="0"/></clipPath>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.35" stop-color="#171311" stop-opacity="0"/>
      <stop offset="1" stop-color="#171311" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#round)">
    <image href="${img}" x="0" y="0" width="1200" height="1200" preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="1200" height="1200" fill="url(#shade)"/>
  </g>
  <g font-family="Georgia, 'Times New Roman', serif">
    <rect x="64" y="64" width="${180 + status.length * 8}" height="52" rx="26" fill="#214735"/>
    <text x="${84}" y="99" fill="#F7F4EE" font-size="26" font-family="Arial, sans-serif" font-weight="700" letter-spacing="2">${status}</text>
    ${titleLines
      .map((l, i) => `<text x="64" y="${940 + i * 78}" fill="#F7F4EE" font-size="70" font-weight="700">${l}</text>`)
      .join("\n    ")}
    <text x="64" y="${940 + titleLines.length * 78 + 20}" fill="#E2CCA8" font-size="40" font-family="Arial, sans-serif">${loc}</text>
    <text x="64" y="1140" fill="#F7F4EE" font-size="64" font-weight="700">${price}</text>
    <text x="1136" y="112" text-anchor="end" fill="#F7F4EE" font-size="34" font-weight="700">Rumah<tspan fill="#8FB59D">Plus</tspan></text>
    <text x="1136" y="1140" text-anchor="end" fill="#E2CCA8" font-size="30" font-family="Arial, sans-serif">${esc(type)}</text>
  </g>
</svg>`;
}

function wrap(text, max) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}
