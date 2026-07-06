import Link from "next/link";
import { stats, listJobs, listLeads, listClients } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import { IconPlus, IconBolt, IconUsers, IconInbox } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ringkasan" };

export default function AdminHome() {
  const s = stats();
  const jobs = listJobs().slice(0, 6);
  const leads = listLeads().slice(0, 5);
  const clients = listClients();
  const activeClients = clients.filter((c) => c.stage !== "batal" && c.stage !== "closing").length;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Ringkasan</h1>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Stat label="Listing" value={s.listingsTotal} href="/admin/listings" />
        <Stat label="Klien aktif" value={activeClients} href="/admin/clients" />
        <Stat label="Leads baru" value={s.leadsNew} href="/admin/leads" highlight={s.leadsNew > 0} />
        <Stat label="Otomasi berjalan" value={s.jobs} href="/admin/otomasi" />
      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Action href="/admin/otomasi" icon={IconBolt} title="Otomasi" />
        <Action href="/admin/listings/new" icon={IconPlus} title="Studio Listing" />
        <Action href="/admin/clients" icon={IconUsers} title="Klien" />
        <Action href="/admin/leads" icon={IconInbox} title="Leads" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* RECENT JOBS */}
        <section className="card p-8">
          <h2 className="text-2xl font-extrabold text-ink">Aktivitas terbaru</h2>
          {jobs.length === 0 ? (
            <p className="mt-4 text-lg font-semibold text-ink-faint">Belum ada aktivitas. Mulai dari Otomasi.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center gap-4 py-3.5">
                  <span className="min-w-0 flex-1 truncate text-lg font-bold text-ink">{j.title}</span>
                  <span className="shrink-0 text-base font-semibold text-ink-faint">{timeAgo(j.createdAt)}</span>
                  {j.result && (
                    <Link href={j.result} target="_blank" className="shrink-0 text-base font-extrabold text-pine-700 hover:underline">
                      Buka
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* LEADS */}
        <section className="card p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink">Leads terbaru</h2>
            <Link href="/admin/leads" className="text-base font-extrabold text-pine-700 hover:underline">Semua</Link>
          </div>
          {leads.length === 0 ? (
            <p className="mt-4 text-lg font-semibold text-ink-faint">Belum ada leads.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {leads.map((l) => (
                <li key={l.id} className="py-3.5">
                  <div className="text-lg font-bold text-ink">{l.name}</div>
                  <div className="text-base font-semibold text-ink-faint">
                    {l.phone}{l.propertyTitle ? ` · ${l.propertyTitle}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, href, highlight }) {
  return (
    <Link
      href={href}
      className={`block rounded-3xl border p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift ${
        highlight ? "border-pine-700 bg-pine-700 text-paper" : "border-ink/10 bg-white text-ink"
      }`}
    >
      <div className="text-5xl font-extrabold">{value}</div>
      <div className={`mt-2 text-lg font-bold ${highlight ? "text-paper/90" : "text-ink-soft"}`}>{label}</div>
    </Link>
  );
}

function Action({ href, icon: Icon, title }) {
  return (
    <Link href={href} className="group card flex items-center gap-4 p-6 transition hover:-translate-y-1 hover:shadow-lift">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-pine-50 text-pine-700 transition group-hover:bg-pine-700 group-hover:text-paper">
        <Icon size={28} />
      </span>
      <span className="text-xl font-extrabold text-ink">{title}</span>
    </Link>
  );
}
