import { notFound } from "next/navigation";
import Link from "next/link";
import Gallery from "@/components/Gallery";
import KprCalculator from "@/components/KprCalculator";
import PropertyCard from "@/components/PropertyCard";
import InquiryForm from "@/components/InquiryForm";
import PropertyMap from "@/components/PropertyMap";
import { getListing, relatedListings } from "@/lib/store";
import { TYPE_LABELS, SITE } from "@/data";
import { formatPrice, formatDate } from "@/lib/utils";
import { IconBed, IconBath, IconCar, IconArea, IconRuler, IconDoc, IconPin, IconPhone, IconChat, IconCheck, IconStar } from "@/components/icons";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }) {
  const p = getListing(params.slug);
  if (!p) return { title: "Properti tidak ditemukan" };
  const desc = p.description.slice(0, 155);
  return {
    title: `${p.title} — ${p.location}`,
    description: desc,
    alternates: { canonical: `/properti/${p.slug}` },
    openGraph: {
      type: "article",
      title: `${p.title} — ${p.location}`,
      description: desc,
      images: [{ url: p.images[0] }],
      url: `${SITE.url}/properti/${p.slug}`,
    },
  };
}

export default function PropertyDetail({ params }) {
  const p = getListing(params.slug);
  if (!p) notFound();
  const related = relatedListings(p);
  const images = p.images?.length ? p.images : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000&q=80"];

  const specs = [
    p.bedrooms > 0 && { icon: IconBed, label: "Kamar Tidur", value: p.bedrooms },
    p.bathrooms > 0 && { icon: IconBath, label: "Kamar Mandi", value: p.bathrooms },
    p.carports > 0 && { icon: IconCar, label: "Carport", value: p.carports },
    p.landSize > 0 && { icon: IconArea, label: "Luas Tanah", value: `${p.landSize} m²` },
    p.buildingSize > 0 && { icon: IconRuler, label: "Luas Bangunan", value: `${p.buildingSize} m²` },
    { icon: IconDoc, label: "Sertifikat", value: p.certificate },
  ].filter(Boolean);

  const waNumber = "62" + p.agent.phone.replace(/\D/g, "").replace(/^0/, "");
  const geo = p.geo?.lat ? p.geo : p.lat && p.lng ? { lat: p.lat, lng: p.lng } : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: p.title,
    description: p.description,
    url: `${SITE.url}/properti/${p.slug}`,
    image: p.images,
    numberOfRoomsTotal: p.bedrooms || undefined,
    address: { "@type": "PostalAddress", addressLocality: p.city, addressRegion: p.location, addressCountry: "ID" },
    floorSize: p.buildingSize ? { "@type": "QuantitativeValue", value: p.buildingSize, unitCode: "MTK" } : undefined,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      category: p.listing === "sewa" ? "Rent" : "Sale",
    },
  };

  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-ink-faint">
        <Link href="/" className="hover:text-pine-700">Beranda</Link>
        <span className="mx-2">/</span>
        <Link href="/properti" className="hover:text-pine-700">Properti</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{p.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.65fr_1fr]">
        <div>
          <Gallery images={images} title={p.title} />

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{TYPE_LABELS[p.type]}</span>
              <span className="chip">{p.listing === "sewa" ? "Disewakan" : "Dijual"}</span>
              <span className="text-xs text-ink-faint">Tayang {formatDate(p.posted)}</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">{p.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-ink-soft">
              <IconPin size={17} /> {p.location}
            </p>
            <div className="mt-4 font-serif text-3xl font-bold text-pine-700">
              {formatPrice(p.price, p.listing, p.priceUnit)}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
                <s.icon size={22} className="text-pine-600" />
                <div className="mt-2 text-xs text-ink-faint">{s.label}</div>
                <div className="font-serif text-lg font-semibold text-ink">{s.value}</div>
              </div>
            ))}
          </div>

          {/* FASILITAS */}
          {p.facilities?.length > 0 && (
            <div className="mt-10">
              <h2 className="text-3xl font-extrabold text-ink">Fasilitas</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.facilities.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 rounded-2xl bg-pine-50 px-4 py-3 text-base font-bold text-ink">
                    <IconCheck size={20} className="shrink-0 text-pine-700" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-3xl font-extrabold text-ink">Tentang properti ini</h2>
            <p className="mt-4 whitespace-pre-line text-lg leading-[1.85] text-ink-soft">{p.description}</p>
          </div>

          {/* SELLING POINTS */}
          {p.sellingPoints?.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-extrabold text-ink">Kenapa properti ini layak</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {p.sellingPoints.map((sp) => (
                  <div key={sp.aspect} className="rounded-3xl bg-pine-800 p-6 text-paper">
                    <div className="text-base font-extrabold text-pine-300">{sp.aspect}</div>
                    <div className="mt-1.5 text-xl font-extrabold leading-snug">{sp.point}</div>
                    {sp.detail && <p className="mt-2 text-base font-semibold leading-relaxed text-paper/80">{sp.detail}</p>}
                  </div>
                ))}
              </div>
              {p.targetBuyers?.length > 0 && (
                <div className="mt-4 rounded-3xl border-2 border-pine-200 bg-pine-50 p-6">
                  <div className="flex items-center gap-2 text-lg font-extrabold text-pine-700"><IconStar size={22} /> Paling cocok untuk</div>
                  <ul className="mt-2 space-y-1.5 text-lg font-semibold text-ink-soft">
                    {p.targetBuyers.map((t) => <li key={t}>• {t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* LOKASI & SEKITAR */}
          {(geo || p.locationInsight) && (
            <div className="mt-12">
              <h2 className="text-3xl font-extrabold text-ink">Lokasi & sekitar</h2>
              {p.locationInsight?.summary && (
                <p className="mt-3 text-lg font-semibold text-ink-soft">{p.locationInsight.summary}</p>
              )}
              {geo && (
                <div className="mt-5">
                  <PropertyMap single points={[{ lat: geo.lat, lng: geo.lng, title: p.title }]} height={400} />
                </div>
              )}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {p.locationInsight?.strategic?.length > 0 && (
                  <div className="card p-7">
                    <h3 className="text-xl font-extrabold text-ink">Kenapa strategis</h3>
                    <ul className="mt-3 space-y-2.5">
                      {p.locationInsight.strategic.map((s) => (
                        <li key={s} className="flex gap-3 text-base font-semibold text-ink-soft">
                          <IconCheck size={22} className="mt-0.5 shrink-0 text-pine-600" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.locationInsight?.nearby?.length > 0 && (
                  <div className="card p-7">
                    <h3 className="text-xl font-extrabold text-ink">Terdekat dari sini</h3>
                    <ul className="mt-3 divide-y divide-ink/5">
                      {p.locationInsight.nearby.map((n) => (
                        <li key={n.name} className="flex items-center gap-3 py-2.5">
                          <span className="min-w-0 flex-1 text-base font-bold text-ink">{n.name}</span>
                          <span className="shrink-0 text-base font-semibold text-ink-faint">{n.category}</span>
                          {n.minutes ? <span className="shrink-0 text-base font-extrabold text-pine-700">± {n.minutes} mnt</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-pine-100 font-serif text-xl font-bold text-pine-700">
                  {p.agent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-ink">
                    {p.agent.name}
                    {p.agent.verified && <IconCheck size={16} className="text-pine-600" />}
                  </div>
                  <div className="text-xs text-ink-faint">{p.agent.company}</div>
                </div>
              </div>

              <a href={`tel:${p.agent.phone.replace(/\D/g, "")}`} className="btn-primary mt-5 w-full">
                <IconPhone size={17} /> {p.agent.phone}
              </a>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="btn-outline mt-2 w-full">
                <IconChat size={17} /> Chat WhatsApp
              </a>
            </div>

            <InquiryForm propertySlug={p.slug} propertyTitle={p.title} />

            {p.listing === "jual" && p.price >= 100_000_000 && <KprCalculator price={p.price} />}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-serif text-2xl font-semibold text-ink sm:text-3xl">Properti serupa</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <PropertyCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
