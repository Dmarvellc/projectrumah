import { NextResponse } from "next/server";
import { getListing, saveListing, deleteListing } from "@/lib/store";
import { geocode } from "@/lib/geo";

export const runtime = "nodejs";
export const maxDuration = 60;

const NUM = ["price", "bedrooms", "bathrooms", "carports", "landSize", "buildingSize", "floors", "maidRooms", "garage", "ipl"];

// POST { slug, patch } — ubah listing. Seed (bawaan) otomatis dijadikan
// salinan admin yang bisa diedit; aslinya disembunyikan agar tak dobel.
export async function POST(req) {
  try {
    const { slug, patch = {} } = await req.json();
    const existing = getListing(slug);
    if (!existing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

    const clean = { ...patch };
    for (const k of NUM) if (k in clean) clean[k] = Number(clean[k]) || 0;
    if ("facilities" in clean && !Array.isArray(clean.facilities)) clean.facilities = [];
    if ("imb" in clean) clean.imb = Boolean(clean.imb);
    if ("featured" in clean) clean.featured = Boolean(clean.featured);

    // Geocode ulang bila lokasi/cluster berubah (agar peta tetap benar).
    let geo = existing.geo || null;
    const locChanged = (clean.location && clean.location !== existing.location) || (clean.cluster !== undefined && clean.cluster !== existing.cluster);
    if (locChanged) {
      const q = [clean.cluster ?? existing.cluster, clean.location ?? existing.location].filter(Boolean).join(", ");
      const g = await geocode(q);
      if (g) geo = { lat: g.lat, lng: g.lng };
    }

    const isSeed = existing.source === "seed";
    if (isSeed) deleteListing(slug); // sembunyikan seed asli

    const record = saveListing({
      ...existing,
      ...clean,
      geo,
      slug, // pertahankan URL
      source: "admin",
      id: existing.source === "seed" ? undefined : existing.id,
    });

    return NextResponse.json({ ok: true, slug: record.slug, url: `/properti/${record.slug}` });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
