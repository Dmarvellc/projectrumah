"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/data";
import { IconMenu, IconClose, IconPhone } from "@/components/icons";

const NAV = [
  { href: "/properti?listing=jual", label: "Dijual" },
  { href: "/properti?listing=sewa", label: "Disewa" },
  { href: "/properti", label: "Semua Properti" },
  { href: "/artikel", label: "Artikel" },
  { href: "/tentang", label: "Tentang" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="container-x flex h-20 items-center justify-between">
        <Link href="/" className="flex items-baseline gap-[2px]">
          <span className="text-3xl font-extrabold tracking-tight text-ink">
            Rumah
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-pine-600">
            Plus
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-lg font-bold text-ink-soft transition hover:text-pine-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`tel:${SITE.phoneRaw}`} className="btn-outline py-3">
            <IconPhone size={20} /> {SITE.phone}
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 lg:hidden"
          aria-label="Menu"
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-paper lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3.5 text-lg font-bold text-ink-soft hover:bg-ink/[.04]"
              >
                {n.label}
              </Link>
            ))}
            <a href={`tel:${SITE.phoneRaw}`} className="btn-primary mt-2">
              <IconPhone size={16} /> Hubungi {SITE.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
