import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { getListing } from "@/lib/store";
import { TYPE_LABELS, SITE } from "@/data";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brosur", robots: { index: false } };

export default function BrosurPage({ params }) {
  const p = getListing(params.slug);
  if (!p) notFound();

  const price = formatPrice(p.price, p.listing, p.priceUnit);
  const status = p.listing === "sewa" ? "DISEWAKAN" : "DIJUAL";
  const type = TYPE_LABELS[p.type] || "Properti";
  const where = [p.cluster, p.location].filter(Boolean).join(", ");
  const img = p.images?.[0] || null; // tanpa foto → blok bermerek, bukan foto palsu
  const gallery = (p.images || []).slice(1, 4);
  const ag = p.agent || {};
  const waNumber = "62" + String(ag.phone || SITE.phone).replace(/\D/g, "").replace(/^0/, "");

  const specs = [
    p.bedrooms > 0 && ["Kamar Tidur", p.bedrooms],
    p.bathrooms > 0 && ["Kamar Mandi", p.bathrooms],
    p.carports > 0 && ["Carport", p.carports],
    p.landSize > 0 && ["Luas Tanah", `${p.landSize} m²`],
    p.buildingSize > 0 && ["Luas Bangunan", `${p.buildingSize} m²`],
    p.floors > 0 && ["Lantai", p.floors],
    p.certificate && ["Sertifikat", p.certificate],
    p.facing && ["Hadap", p.facing],
  ].filter(Boolean);

  const points = (
    p.sellingPoints?.length ? p.sellingPoints.map((s) => s.point) : p.highlights?.length ? p.highlights : p.tags || []
  ).slice(0, 5);
  const nearby = (p.locationInsight?.nearby || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-ink/5 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
        }
      `}</style>

      <div className="mx-auto mb-5 flex max-w-[820px] items-center justify-between px-4 no-print">
        <span className="text-lg font-bold text-ink-soft">Pratinjau brosur — {p.title}</span>
        <PrintButton />
      </div>

      {/* LEMBAR BROSUR */}
      <div className="mx-auto max-w-[820px] overflow-hidden rounded-3xl bg-white shadow-card print:rounded-none print:shadow-none">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-pine-800 px-8 py-5 text-paper">
          <div className="text-2xl font-extrabold">Rumah<span className="text-pine-300">Plus</span></div>
          <div className="rounded-xl bg-sand-400 px-4 py-1.5 text-base font-extrabold tracking-wide text-ink">{status}</div>
        </div>

        {/* HERO */}
        <div className="relative">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={p.title} className="h-[300px] w-full object-cover" />
          ) : (
            <div className="grid h-[300px] w-full place-items-center bg-pine-700 text-paper/85">
              <div className="text-center">
                <div className="text-2xl font-extrabold">Foto menyusul</div>
                <div className="mt-1 text-base font-semibold">Hubungi kami untuk foto & jadwal survei</div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6">
          {/* JUDUL + HARGA */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-pine-700">{type}</div>
              <h1 className="text-3xl font-extrabold leading-tight text-ink">{p.title}</h1>
              <div className="mt-1 text-lg font-semibold text-ink-soft">{where}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-ink">{price}</div>
            </div>
          </div>

          {/* SPESIFIKASI */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-pine-50 px-4 py-3 text-center">
                <div className="text-xl font-extrabold text-ink">{v}</div>
                <div className="text-sm font-bold text-ink-faint">{k}</div>
              </div>
            ))}
          </div>

          {/* GALERI KECIL */}
          {gallery.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {gallery.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-24 w-full rounded-2xl object-cover" />
              ))}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-6">
            {/* KEUNGGULAN */}
            {points.length > 0 && (
              <div>
                <div className="text-lg font-extrabold text-ink">Keunggulan</div>
                <ul className="mt-2 space-y-1.5">
                  {points.map((t) => (
                    <li key={t} className="flex gap-2 text-base font-semibold text-ink-soft">
                      <span className="font-extrabold text-pine-700">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* SEKITAR */}
            {nearby.length > 0 && (
              <div>
                <div className="text-lg font-extrabold text-ink">Terdekat</div>
                <ul className="mt-2 space-y-1.5">
                  {nearby.map((n) => (
                    <li key={n.name} className="flex justify-between gap-2 text-base font-semibold text-ink-soft">
                      <span className="min-w-0 truncate">{n.name}</span>
                      {n.minutes ? <span className="shrink-0 font-extrabold text-pine-700">{n.minutes} mnt</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* KONTAK */}
        <div className="mt-2 flex items-center justify-between bg-ink px-8 py-5 text-paper">
          <div>
            <div className="text-xl font-extrabold">{ag.name || SITE.name}</div>
            <div className="text-base font-semibold text-paper/80">{ag.company || "RumahPlus Curated"}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold text-sand-300">{ag.phone || SITE.phone}</div>
            <div className="text-base font-semibold text-paper/80">wa.me/{waNumber}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
