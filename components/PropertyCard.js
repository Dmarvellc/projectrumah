import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { TYPE_LABELS } from "@/data";
import { IconBed, IconBath, IconRuler, IconArea, IconPin, IconHome } from "@/components/icons";

export default function PropertyCard({ p }) {
  return (
    <Link
      href={`/properti/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
        {p.images?.[0] ? (
          <Image
            src={p.images[0]}
            alt={p.title}
            fill
            sizes="(max-width:768px) 100vw, 380px"
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-pine-800">
            <div className="text-center text-paper/80">
              <IconHome size={44} className="mx-auto" />
              <div className="mt-2 text-base font-bold">Foto menyusul</div>
            </div>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-xl bg-pine-800/95 px-4 py-1.5 text-sm font-extrabold text-paper backdrop-blur">
          {p.listing === "sewa" ? "Disewa" : "Dijual"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="text-base font-extrabold text-pine-700">{TYPE_LABELS[p.type]}</div>

        <h3 className="mt-1 line-clamp-1 text-xl font-extrabold text-ink">{p.title}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-base font-semibold text-ink-faint">
          <IconPin size={18} className="shrink-0" /> <span className="line-clamp-1">{p.location}</span>
        </p>

        <div className="mt-4 text-2xl font-extrabold text-ink">
          {formatPrice(p.price, p.listing, p.priceUnit)}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-5 text-base font-bold text-ink-soft">
          {p.bedrooms > 0 && <Spec icon={IconBed} value={`${p.bedrooms} KT`} />}
          {p.bathrooms > 0 && <Spec icon={IconBath} value={`${p.bathrooms} KM`} />}
          {p.buildingSize > 0 && <Spec icon={IconRuler} value={`${p.buildingSize} m²`} />}
          {p.buildingSize === 0 && p.landSize > 0 && (
            <Spec icon={IconArea} value={`${p.landSize} m²`} />
          )}
        </div>
      </div>
    </Link>
  );
}

function Spec({ icon: Icon, value }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon size={20} className="text-ink-faint" />
      {value}
    </span>
  );
}
