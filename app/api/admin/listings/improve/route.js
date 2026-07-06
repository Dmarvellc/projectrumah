import { NextResponse } from "next/server";
import { getListing, saveListing } from "@/lib/store";
import { generateListing } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

// "Improve with AI" — tulis ulang deskripsi, highlight, tag, dan judul SEO
// untuk listing yang sudah ada (hanya listing buatan admin yang bisa disimpan).
export async function POST(req) {
  try {
    const { slug } = await req.json();
    const p = getListing(slug);
    if (!p) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });
    if (p.source === "seed") {
      return NextResponse.json({ error: "Listing seed tidak dapat diubah" }, { status: 400 });
    }

    const gen = await generateListing({
      details: {
        type: p.type,
        listing: p.listing,
        location: p.location,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        landSize: p.landSize,
        buildingSize: p.buildingSize,
        extra: (p.tags || []).join(", "),
      },
      images: [],
    });

    const record = saveListing({
      ...p,
      title: gen.title || p.title,
      description: gen.description || p.description,
      highlights: gen.highlights?.length ? gen.highlights : p.highlights,
      tags: gen.tags?.length ? gen.tags : p.tags,
      seoTitle: gen.seoTitle || p.seoTitle,
    });

    return NextResponse.json({ ok: true, slug: record.slug, aiUsed: gen.aiUsed });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
