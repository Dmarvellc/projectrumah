"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { IconGrid, IconPlus, IconList, IconMega, IconInbox, IconBolt, IconUsers, IconArea, IconCalendar, IconPlay, IconStar } from "@/components/icons";

// Alur kerja agen: HARI INI (respons & janji) → LISTING (produksi) → MARKETING (distribusi)
const NAV = [
  { href: "/admin", label: "Ringkasan", icon: IconGrid, exact: true },
  { heading: "Hari ini" },
  { href: "/admin/agenda", label: "Agenda", icon: IconCalendar },
  { href: "/admin/leads", label: "Leads", icon: IconInbox },
  { href: "/admin/clients", label: "Klien", icon: IconUsers },
  { heading: "Listing" },
  { href: "/admin/otomasi", label: "Otomasi", icon: IconBolt },
  { href: "/admin/listings/new", label: "Studio Listing", icon: IconPlus },
  { href: "/admin/listings", label: "Kelola Listing", icon: IconList },
  { href: "/admin/cma", label: "Harga & Pasar", icon: IconArea },
  { heading: "Marketing" },
  { href: "/admin/marketing", label: "Marketing Kit", icon: IconMega },
  { href: "/admin/video", label: "Video Sosmed", icon: IconPlay },
  { heading: "Pengaturan" },
  { href: "/admin/brand", label: "Brand & Profil", icon: IconStar },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return children;
  return (
    <DashboardShell brand="Dashboard Agent" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
