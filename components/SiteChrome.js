"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/data";

export function SiteHeader() {
  const pathname = usePathname();
  if (["/admin", "/marketing", "/developer", "/masuk", "/daftar", "/brosur"].some((p) => pathname?.startsWith(p))) return null;
  return <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (["/admin", "/marketing", "/developer", "/masuk", "/daftar", "/brosur"].some((p) => pathname?.startsWith(p))) return null;
  return <Footer />;
}

// Tombol WhatsApp mengambang — standar portal properti untuk respons cepat.
export function WaFloat() {
  const pathname = usePathname();
  if (["/admin", "/marketing", "/developer", "/masuk", "/daftar", "/brosur"].some((p) => pathname?.startsWith(p))) return null;
  return (
    <a
      href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Halo RumahPlus, saya ingin bertanya tentang properti.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-pine-700 py-4 pl-5 pr-6 text-lg font-extrabold text-paper shadow-lift transition hover:bg-pine-800"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.7.3.2.5.1.7-.1l1-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.4 1.4Z" />
      </svg>
      Chat Kami
    </a>
  );
}
