"use client";

import DashboardShell from "@/components/DashboardShell";
import { IconGrid, IconUsers } from "@/components/icons";

const NAV = [
  { href: "/developer", label: "Ringkasan", icon: IconGrid, exact: true },
  { href: "/developer/users", label: "Pengguna", icon: IconUsers },
];

export default function DeveloperLayoutClient({ children }) {
  return (
    <DashboardShell brand="Dashboard Developer" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
