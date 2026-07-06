"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export function SiteHeader() {
  const pathname = usePathname();
  if (["/admin", "/marketing", "/developer", "/masuk", "/daftar"].some((p) => pathname?.startsWith(p))) return null;
  return <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (["/admin", "/marketing", "/developer", "/masuk", "/daftar"].some((p) => pathname?.startsWith(p))) return null;
  return <Footer />;
}
