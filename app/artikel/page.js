import Link from "next/link";
import Image from "next/image";
import { allArticles } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { IconArrow } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Artikel & Panduan Properti",
  description:
    "Wawasan pasar, panduan KPR, tips beli-sewa, dan strategi investasi properti di Indonesia. Dibahas tuntas oleh redaksi RumahPlus.",
  alternates: { canonical: "/artikel" },
};

export default function ArtikelPage() {
  const [lead, ...rest] = allArticles({ publishedOnly: true });

  return (
    <div className="container-x py-12">
      <header className="max-w-2xl">
        <span className="eyebrow">Wawasan</span>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Artikel & panduan properti
        </h1>
        <p className="mt-3 text-lg text-ink-soft">
          Pengetahuan praktis untuk membantu setiap keputusan properti Anda — dari
          KPR hingga strategi investasi.
        </p>
      </header>

      {/* LEAD */}
      <Link
        href={`/artikel/${lead.slug}`}
        className="group mt-10 grid overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card transition hover:shadow-lift md:grid-cols-2"
      >
        <div className="relative aspect-[16/10] md:aspect-auto">
          <Image src={lead.cover} alt={lead.title} fill sizes="(max-width:768px) 100vw, 620px" className="object-cover transition duration-700 group-hover:scale-105" />
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <span className="eyebrow">{lead.category}</span>
          <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            {lead.title}
          </h2>
          <p className="mt-3 text-ink-soft">{lead.excerpt}</p>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-pine-700">
            Baca selengkapnya <IconArrow size={16} />
          </div>
          <div className="mt-4 text-xs text-ink-faint">
            {formatDate(lead.date)} · {lead.readMinutes} menit baca
          </div>
        </div>
      </Link>

      {/* GRID */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {rest.map((a) => (
          <Link
            key={a.slug}
            href={`/artikel/${a.slug}`}
            className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative aspect-[16/10] bg-ink/5">
              <Image src={a.cover} alt={a.title} fill sizes="400px" className="object-cover transition duration-700 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <span className="eyebrow">{a.category}</span>
              <h3 className="mt-2 line-clamp-2 font-serif text-xl font-semibold text-ink">{a.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{a.excerpt}</p>
              <div className="mt-4 text-xs text-ink-faint">
                {formatDate(a.date)} · {a.readMinutes} menit baca
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
