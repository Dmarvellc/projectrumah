import VideoStudio from "@/components/admin/VideoStudio";
import { allListings, getBrand } from "@/lib/store";

export const metadata = { title: "Video Sosmed" };
export const dynamic = "force-dynamic";

export default function VideoPage({ searchParams }) {
  // Hanya field yang dibutuhkan kanvas — payload tetap ramping.
  const listings = allListings({ publishedOnly: true }).map((l) => ({
    slug: l.slug,
    title: l.title,
    type: l.type,
    listing: l.listing,
    price: l.price,
    priceUnit: l.priceUnit,
    cluster: l.cluster || "",
    location: l.location || "",
    city: l.city || "",
    bedrooms: l.bedrooms || 0,
    bathrooms: l.bathrooms || 0,
    landSize: l.landSize || 0,
    buildingSize: l.buildingSize || 0,
    certificate: l.certificate || "",
    images: l.images || [],
    photoCaptions: l.photoCaptions || [],
    sellingPoints: l.sellingPoints || [],
    locationInsight: l.locationInsight || null,
    agent: l.agent || null,
    marketing: l.marketing ? { instagram: l.marketing.instagram, hashtags: l.marketing.hashtags } : null,
  }));

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Video Sosmed</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Video slide otomatis dari data listing — Story/Reels/TikTok, Post IG, Square, dan Landscape.
          Konten tersusun seperti iklan properti: hook, harga, galeri, selling point, lokasi, CTA.
        </p>
      </header>
      <VideoStudio listings={listings} initialSlug={searchParams?.slug || ""} brand={getBrand()} />
    </div>
  );
}
