"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { IconGrid, IconPlus, IconList, IconMega, IconInbox, IconBolt, IconUsers, IconArea, IconCalendar, IconPlay } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: IconGrid, exact: true },
  { href: "/admin/agenda", label: "Agenda", icon: IconCalendar },
  { href: "/admin/otomasi", label: "Otomasi", icon: IconBolt },
  { href: "/admin/listings/new", label: "Studio Listing", icon: IconPlus },
  { href: "/admin/listings", label: "Kelola Listing", icon: IconList },
  { href: "/admin/cma", label: "Harga & Pasar", icon: IconArea },
  { href: "/admin/clients", label: "Klien", icon: IconUsers },
  { href: "/admin/marketing", label: "Marketing Kit", icon: IconMega },
  { href: "/admin/video", label: "Video Sosmed", icon: IconPlay },
  { href: "/admin/leads", label: "Leads", icon: IconInbox },
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
