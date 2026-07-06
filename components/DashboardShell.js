"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconLogout, IconExternal } from "@/components/icons";

// Kerangka bersama 3 dashboard (Agent / Marketing / Developer).
// Desain: tegas, minimalist, teks & ikon besar, radius lega.
export default function DashboardShell({ brand, nav, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await Promise.all([
      fetch("/api/auth/session", { method: "DELETE" }),
      fetch("/api/admin/login", { method: "DELETE" }),
    ]);
    router.push("/masuk");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex w-full">
        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-ink/10 bg-white p-5 lg:flex">
          <Link href="/" className="px-2 py-3 text-2xl font-extrabold text-ink">
            Rumah<span className="text-pine-600">Plus</span>
          </Link>
          <div className="px-2 pb-4 text-base font-bold text-pine-700">{brand}</div>

          <nav className="flex-1 space-y-1.5">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-base font-bold transition ${
                    active ? "bg-pine-700 text-paper" : "text-ink-soft hover:bg-ink/[.05]"
                  }`}
                >
                  <n.icon size={22} /> {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1.5 border-t border-ink/10 pt-4">
            <Link href="/" target="_blank" className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-base font-bold text-ink-soft hover:bg-ink/[.05]">
              <IconExternal size={22} /> Lihat situs
            </Link>
            <button onClick={logout} className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-base font-bold text-ink-soft hover:bg-ink/[.05]">
              <IconLogout size={22} /> Keluar
            </button>
          </div>
        </aside>

        {/* MOBILE TOPBAR */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 flex items-center gap-1.5 overflow-x-auto border-b border-ink/10 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${active ? "bg-pine-700 text-paper" : "text-ink-soft"}`}
                >
                  <n.icon size={18} /> {n.label}
                </Link>
              );
            })}
          </div>

          <div className="min-w-0 flex-1 p-5 sm:p-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
