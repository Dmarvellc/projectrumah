import { NextResponse } from "next/server";
import { buildDeckBase64 } from "@/lib/ppt";
import { slugify } from "@/lib/slug";
import { getListing, saveListing } from "@/lib/store";
import { geocode } from "@/lib/geo";
import { generateLocationInsight } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  try {
    const { listing = {} } = await req.json();
    const base64 = await buildDeckBase64(listing);
    const filename = `${slugify(listing.title || "listing")}.pptx`;
    return NextResponse.json({ filename, base64 });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// GET ?slug=<slug> — unduh langsung .pptx dari listing tersimpan (sekali klik).
export async function GET(req) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    let listing = slug ? getListing(slug) : null;
    if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

    // Backfill listing lama: hitung titik peta & analisis kawasan sekali, lalu simpan.
    if (!listing.geo || !listing.locationInsight) {
      const [geo, locationInsight] = await Promise.all([
        listing.geo || (listing.lat && listing.lng ? { lat: listing.lat, lng: listing.lng } : geocode([listing.cluster, listing.location].filter(Boolean).join(", "))),
        listing.locationInsight || generateLocationInsight({ location: listing.location, type: listing.type, listing: listing.listing }),
      ]);
      listing = { ...listing, geo: geo ? { lat: geo.lat, lng: geo.lng } : null, locationInsight };
      if (listing.source !== "seed") saveListing(listing);
    }

    const base64 = await buildDeckBase64(listing);
    const filename = `${slugify(listing.title || "listing")}.pptx`;
    return new NextResponse(Buffer.from(base64, "base64"), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
