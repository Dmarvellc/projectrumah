import FilterBar from "@/components/FilterBar";
import PropertyCard from "@/components/PropertyCard";
import SortSelect from "@/components/SortSelect";
import CatalogMap from "@/components/CatalogMap";
import { allListings } from "@/lib/store";
import { TYPE_LABELS, SITE } from "@/data";

export const dynamic = "force-dynamic";

function headline(sp) {
  const t = sp.type ? TYPE_LABELS[sp.type] : "Properti";
  const status = sp.listing === "sewa" ? "Disewakan" : sp.listing === "jual" ? "Dijual" : "";
  const loc = sp.city && sp.city !== "Semua Kota" ? ` di ${sp.city}` : "";
  return `${t} ${status}${loc}`.replace(/\s+/g, " ").trim();
}

export function generateMetadata({ searchParams }) {
  const sp = searchParams || {};
  const title = headline(sp);
  const count = filterProperties(sp).length;
  return {
    title,
    description: `Temukan ${count} ${title.toLowerCase()} pilihan yang sudah diverifikasi di ${SITE.name}. Data lengkap, legalitas terperiksa, dan pendampingan transaksi.`,
    alternates: { canonical: "/properti" },
  };
}

export default function PropertiPage({ searchParams }) {
  const sp = searchParams || {};
  const filtered = filterProperties(sp);
  const mapPoints = filtered.map((p) => {
    const geo = p.geo?.lat ? p.geo : p.lat && p.lng ? { lat: p.lat, lng: p.lng } : {};
    return {
      lat: geo.lat, lng: geo.lng,
      title: p.title, price: p.price, listing: p.listing, priceUnit: p.priceUnit,
      url: `/properti/${p.slug}`, image: p.images?.[0],
    };
  });

  return (
    <div className="container-x py-12">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{headline(sp)}</h1>
        <p className="mt-3 text-lg font-semibold text-ink-soft">{filtered.length} properti ditemukan</p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[300px_1fr]">
        <FilterBar current={sp} />

        <div>
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CatalogMap points={mapPoints} />
            </div>
            <SortSelect current={sp} />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-16 text-center">
              <h3 className="font-serif text-xl font-semibold text-ink">Tidak ada properti yang cocok</h3>
              <p className="mt-2 text-sm text-ink-soft">Coba ubah atau reset filter pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function filterProperties(sp) {
  let list = allListings({ publishedOnly: true });

  if (sp.listing) list = list.filter((p) => p.listing === sp.listing);
  if (sp.type) list = list.filter((p) => p.type === sp.type);
  if (sp.city && sp.city !== "Semua Kota") list = list.filter((p) => p.city === sp.city);
  if (sp.beds) list = list.filter((p) => p.bedrooms >= Number(sp.beds));
  if (sp.q) {
    const q = sp.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  switch (sp.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "newest":
    default:
      list.sort((a, b) => b.posted.localeCompare(a.posted));
  }
  return list;
}
