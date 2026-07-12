import { NextResponse } from "next/server";
import { saveListing, addJob, getBrand, brandAgent } from "@/lib/store";
import { geocode } from "@/lib/geo";
import { generateLocationInsight } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  try {
    const { listing = {}, marketing = null, stages = [] } = await req.json();
    if (!listing.title || !listing.type) {
      return NextResponse.json({ error: "Judul dan tipe wajib" }, { status: 400 });
    }

    // Titik peta: pakai pin yang digeser manual di form bila ada; kalau tidak, geocode.
    const locationFull = [listing.cluster, listing.location].filter(Boolean).join(", ");
    const manualGeo = listing.geo?.lat && listing.geo?.lng ? listing.geo : null;
    // Geocode DULU agar analisis lokasi bisa deteksi tempat nyata dari koordinat.
    const geo = manualGeo || (await geocode(locationFull || listing.location));
    const locationInsight = await generateLocationInsight({
      location: locationFull || listing.location,
      type: listing.type,
      listing: listing.listing,
      lat: geo?.lat,
      lng: geo?.lng,
    });

    const record = saveListing({
      title: listing.title,
      type: listing.type,
      listing: listing.listing || "jual",
      price: Number(listing.price) || 0,
      priceUnit: listing.listing === "sewa" ? "bulan" : undefined,
      location: listing.location || "",
      cluster: listing.cluster || "",
      address: listing.address || "",
      city: listing.city || (listing.location || "").split(",").pop()?.trim() || "",
      bedrooms: Number(listing.bedrooms) || 0,
      bathrooms: Number(listing.bathrooms) || 0,
      carports: Number(listing.carports) || 0,
      landSize: Number(listing.landSize) || 0,
      buildingSize: Number(listing.buildingSize) || 0,
      floors: Number(listing.floors) || 0,
      maidRooms: Number(listing.maidRooms) || 0,
      garage: Number(listing.garage) || 0,
      ipl: Number(listing.ipl) || 0,
      roadWidth: listing.roadWidth || "",
      facilities: Array.isArray(listing.facilities) ? listing.facilities : [],
      yearBuilt: listing.yearBuilt || "",
      electricity: listing.electricity || "",
      water: listing.water || "",
      facing: listing.facing || "",
      furnished: listing.furnished || "",
      condition: listing.condition || "",
      imb: Boolean(listing.imb),
      certificate: listing.certificate || "SHM",
      featured: Boolean(listing.featured),
      description: listing.description || "",
      tags: Array.isArray(listing.tags) ? listing.tags : [],
      highlights: Array.isArray(listing.highlights) ? listing.highlights : [],
      sellingPoints: Array.isArray(listing.sellingPoints) ? listing.sellingPoints : [],
      sellerPoints: Array.isArray(listing.sellerPoints) ? listing.sellerPoints : [],
      internalNotes: listing.internalNotes || "",
      targetBuyers: Array.isArray(listing.targetBuyers) ? listing.targetBuyers : [],
      photoCaptions: Array.isArray(listing.photoCaptions) ? listing.photoCaptions : [],
      seoTitle: listing.seoTitle || listing.title,
      images: Array.isArray(listing.images) && listing.images.length ? listing.images : [],
      geo: geo ? { lat: geo.lat, lng: geo.lng } : null,
      locationInsight,
      brandName: getBrand().brandName,
      agent: listing.agent || brandAgent(),
      marketing,
      status: "published",
    });

    addJob({
      type: "listing",
      title: record.title,
      slug: record.slug,
      stages,
      result: `/properti/${record.slug}`,
    });

    return NextResponse.json({ ok: true, slug: record.slug, url: `/properti/${record.slug}` });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
