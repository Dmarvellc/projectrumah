import Link from "next/link";
import { SITE } from "@/data";

export default function Footer({ contact }) {
  const phone = contact?.phone || SITE.phone;
  const phoneRaw = contact?.phoneRaw || SITE.phoneRaw;
  const email = contact?.email || SITE.email;
  return (
    <footer className="mt-24 bg-pine-900 text-pine-100">
      <div className="container-x grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-3xl font-extrabold text-paper">
            Rumah<span className="text-pine-300">Plus</span>
          </Link>
          <p className="mt-4 max-w-xs text-base font-semibold leading-relaxed text-pine-200/90">
            {SITE.description}
          </p>
        </div>

        <FooterCol
          title="Properti"
          links={[
            { href: "/properti?listing=jual", label: "Rumah Dijual" },
            { href: "/properti?listing=sewa", label: "Rumah Disewa" },
            { href: "/properti?type=apartemen", label: "Apartemen" },
            { href: "/properti?type=tanah", label: "Tanah" },
            { href: "/properti?type=ruko", label: "Ruko & Gudang" },
          ]}
        />
        <FooterCol
          title="Perusahaan"
          links={[
            { href: "/tentang", label: "Tentang Kami" },
            { href: "/artikel", label: "Artikel & Panduan" },
            { href: `tel:${phoneRaw}`, label: "Hubungi Kami" },
          ]}
        />
        <div>
          <h4 className="text-lg font-extrabold text-paper">
            Kontak
          </h4>
          <ul className="mt-4 space-y-2.5 text-base font-semibold text-pine-200/90">
            <li>{phone}</li>
            <li>{email}</li>
            <li className="leading-relaxed">{SITE.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-base font-semibold text-pine-200/80 sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. Seluruh hak cipta dilindungi.</span>
          <Link href="/tentang" className="hover:text-paper">Tentang & Kontak</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-lg font-extrabold text-paper">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-base font-semibold text-pine-200/90 transition hover:text-paper">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
