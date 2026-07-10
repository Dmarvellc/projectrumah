import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import { TYPE_LABELS, TYPE_ICON, SITE } from "@/data";
import { allListings, allArticles } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { TYPE_ICON_COMPONENTS, IconShield, IconCheck, IconStar, IconArrow } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function Home() {
  const listings = allListings({ publishedOnly: true });
  const articles = allArticles({ publishedOnly: true });
  const featured = listings.filter((p) => p.featured);
  const featuredList = featured.length >= 3 ? featured : listings;
  const newest = [...listings].sort((a, b) => (b.posted || "").localeCompare(a.posted || "")).slice(0, 8);

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80"
            alt="Hunian pilihan RumahPlus"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pine-900/95 via-pine-900/75 to-pine-900/40" />
        </div>

        <div className="container-x relative py-24 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-extrabold leading-[1.05] text-paper sm:text-7xl">
              Rumah yang tepat, dipilih dengan saksama.
            </h1>
            <p className="mt-6 text-xl font-semibold leading-relaxed text-paper/90">
              Rumah, apartemen, tanah, dan ruko pilihan di kota-kota utama Indonesia —
              terverifikasi dan siap Anda telusuri.
            </p>
          </div>

          <div className="mt-10 max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* BROWSE BY TYPE */}
      <section className="container-x relative z-10 mt-10 sm:-mt-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(TYPE_LABELS).map(([key, label]) => {
            const Icon = TYPE_ICON_COMPONENTS[TYPE_ICON[key]];
            return (
              <Link
                key={key}
                href={`/properti?type=${key}`}
                className="group flex items-center gap-4 rounded-3xl border border-ink/10 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lift sm:p-6"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-pine-50 text-pine-700 transition group-hover:bg-pine-700 group-hover:text-paper">
                  <Icon size={28} />
                </span>
                <div className="min-w-0">
                  <div className="text-xl font-extrabold text-ink">{label}</div>
                  <div className="text-base font-semibold text-ink-faint">
                    {listings.filter((p) => p.type === key).length} listing
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* STATS BAND — kepercayaan lewat angka */}
      <section className="container-x mt-14">
        <div className="grid grid-cols-2 gap-4 rounded-[2.5rem] border border-ink/10 bg-white p-8 shadow-card sm:grid-cols-4 sm:p-10">
          <Stat n={`${listings.length}+`} label="Listing terverifikasi" />
          <Stat n={`${new Set(listings.map((p) => p.city)).size}`} label="Kota di Indonesia" />
          <Stat n="100%" label="Legalitas terperiksa" />
          <Stat n="< 5 mnt" label="Respons WhatsApp" />
        </div>
      </section>

      {/* FEATURED */}
      <Section title="Properti unggulan" href="/properti" linkLabel="Lihat semua">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredList.slice(0, 6).map((p) => (
            <PropertyCard key={p.slug} p={p} />
          ))}
        </div>
      </Section>

      {/* TRUST */}
      <section className="container-x mt-20 sm:mt-24">
        <div className="rounded-[2.5rem] bg-pine-800 p-10 text-paper sm:p-14">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Bukan sekadar daftar properti — sebuah kurasi.
            </h2>
            <p className="mt-5 text-xl font-semibold leading-relaxed text-paper/85">
              Legalitas diperiksa, kondisi divalidasi, harga dipastikan wajar.
              Anda cukup memilih dengan tenang.
            </p>
          </div>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <Value icon={IconShield} title="Legalitas terperiksa" text="Sertifikat dan dokumen diverifikasi sebelum tayang." />
            <Value icon={IconCheck} title="Data jujur" text="Spesifikasi dan kondisi apa adanya." />
            <Value icon={IconStar} title="Pendampingan penuh" text="Dari survei sampai serah terima." />
          </div>
        </div>
      </section>

      {/* NEWEST */}
      <Section title="Terbaru ditambahkan" href="/properti?sort=newest" linkLabel="Lihat semua">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((p) => (
            <PropertyCard key={p.slug} p={p} />
          ))}
        </div>
      </Section>

      {/* TITIP JUAL — mesin akuisisi mandat */}
      <section className="container-x mt-20 sm:mt-24">
        <div className="grid overflow-hidden rounded-[2.5rem] bg-pine-800 md:grid-cols-2">
          <div className="p-10 text-paper sm:p-14">
            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">Mau jual atau sewakan properti Anda?</h2>
            <p className="mt-5 text-xl font-semibold leading-relaxed text-paper/85">
              Titipkan pada kami: analisis harga berbasis data pembanding, foto & materi
              pemasaran profesional, iklan di semua kanal, dan pendampingan sampai akad.
            </p>
            <ul className="mt-6 space-y-2.5 text-lg font-bold text-paper/90">
              <li>✓ Rekomendasi harga jual berbasis data area</li>
              <li>✓ Halaman properti + presentasi + video sosmed dalam 1 hari</li>
              <li>✓ Tanpa biaya di depan — komisi hanya saat terjual</li>
            </ul>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Halo, saya ingin titip jual/sewa properti saya.")}`}
              target="_blank"
              rel="noreferrer"
              className="btn-light mt-8 text-lg"
            >
              Konsultasi gratis via WhatsApp
            </a>
          </div>
          <div className="relative hidden min-h-[380px] md:block">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
              alt="Titip jual properti"
              fill
              sizes="50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <Section title="Artikel & panduan" href="/artikel" linkLabel="Semua artikel">
        <div className="grid gap-6 md:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      </Section>
    </>
  );
}

function Stat({ n, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-extrabold text-pine-700 sm:text-5xl">{n}</div>
      <div className="mt-1.5 text-base font-bold text-ink-soft sm:text-lg">{label}</div>
    </div>
  );
}

function Value({ icon: Icon, title, text }) {
  return (
    <div>
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-paper/10 text-paper">
        <Icon size={30} />
      </span>
      <h3 className="mt-5 text-2xl font-extrabold">{title}</h3>
      <p className="mt-2 text-lg font-semibold leading-relaxed text-paper/80">{text}</p>
    </div>
  );
}

function ArticleCard({ a }) {
  return (
    <Link
      href={`/artikel/${a.slug}`}
      className="group overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] bg-ink/5">
        <Image src={a.cover} alt={a.title} fill sizes="(max-width:768px) 100vw, 400px" className="object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="p-7">
        <div className="text-base font-extrabold text-pine-700">{a.category}</div>
        <h3 className="mt-2 line-clamp-2 text-2xl font-extrabold leading-snug text-ink">{a.title}</h3>
        <div className="mt-4 text-base font-semibold text-ink-faint">
          {formatDate(a.date)} · {a.readMinutes} menit baca
        </div>
      </div>
    </Link>
  );
}

function Section({ title, href, linkLabel, children }) {
  return (
    <section className="container-x mt-20 sm:mt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-4xl font-extrabold text-ink sm:text-5xl">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-2 text-lg font-extrabold text-pine-700 transition-all hover:gap-3">
            {linkLabel} <IconArrow size={20} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
