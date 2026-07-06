// Perakit isi artikel: hasil generator (sections) → blok render
// [{t:"h2",text}, {t:"p",text}, {t:"img",src,alt}] dengan gambar
// editorial disisipkan di antara bagian. Kompatibel dengan artikel
// lama yang body-nya array string.
import { suggestArticleImages } from "@/lib/images";

export function articleBlocks(gen) {
  if (Array.isArray(gen.sections) && gen.sections.length) {
    const blocks = [];
    const imgs = suggestArticleImages(gen.category, 3);
    const mid = Math.max(1, Math.floor(gen.sections.length / 2));
    gen.sections.forEach((s, i) => {
      if (s.heading) blocks.push({ t: "h2", text: s.heading });
      for (const p of s.paragraphs || []) blocks.push({ t: "p", text: p });
      if (i === 0 && imgs[0]) blocks.push({ t: "img", src: imgs[0], alt: s.heading || gen.title || "" });
      else if (i === mid && imgs[1]) blocks.push({ t: "img", src: imgs[1], alt: s.heading || "" });
    });
    return blocks;
  }
  return (gen.body || []).map((b) => (typeof b === "string" ? { t: "p", text: b } : b));
}

// Semua teks paragraf/heading (untuk JSON-LD, hitung baca, preview).
export function articleText(body) {
  return (body || [])
    .map((b) => (typeof b === "string" ? b : b.t === "p" || b.t === "h2" ? b.text : ""))
    .filter(Boolean);
}

export function firstParagraph(body) {
  const b = (body || []).find((x) => (typeof x === "string" ? x : x.t === "p"));
  return typeof b === "string" ? b : b?.text || "";
}

export function articleCover(category) {
  return suggestArticleImages(category, 1)[0];
}
