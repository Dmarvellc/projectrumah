import { allListings } from "@/lib/store";
import MarketingKit from "@/components/admin/MarketingKit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing Kit" };

export default function MarketingPage() {
  const listings = allListings({ publishedOnly: true }).map((l) => ({
    slug: l.slug,
    title: l.title,
    type: l.type,
    listing: l.listing,
    price: l.price,
    priceUnit: l.priceUnit,
    location: l.location,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    landSize: l.landSize,
    buildingSize: l.buildingSize,
    images: l.images,
  }));

  return (
    <div>
      <header className="mb-6">
        <span className="eyebrow">Promosi</span>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Marketing Kit</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Hasilkan materi promosi siap pakai untuk tiap listing — caption sosial,
          copy iklan, email blast, hashtag, dan cover bermerek.
        </p>
      </header>

      {listings.length === 0 ? (
        <p className="text-ink-faint">Belum ada listing.</p>
      ) : (
        <MarketingKit listings={listings} />
      )}
    </div>
  );
}
