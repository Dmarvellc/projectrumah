"use client";

import DashboardShell from "@/components/DashboardShell";
import { IconWand, IconArticle } from "@/components/icons";

const NAV = [
  { href: "/marketing", label: "Studio Artikel", icon: IconWand, exact: true },
  { href: "/marketing/artikel", label: "Artikel Terbit", icon: IconArticle },
];

export default function MarketingLayoutClient({ children }) {
  return (
    <DashboardShell brand="Dashboard Marketing" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
