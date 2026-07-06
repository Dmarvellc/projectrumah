import Link from "next/link";
import { stats, listUsers, listJobs, getSettings } from "@/lib/store";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Ringkasan" };
export const dynamic = "force-dynamic";

export default function DeveloperHome() {
  const s = stats();
  const users = listUsers();
  const jobs = listJobs().slice(0, 8);
  const daily = getSettings().dailyArticle || {};
  const ap = getSettings().autopilot || {};

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Dashboard Developer</h1>
        <p className="mt-2 text-lg text-ink-soft">Kesehatan website, konten, dan pengguna dalam satu layar.</p>
      </header>

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Stat label="Pengguna" value={users.length} href="/developer/users" />
        <Stat label="Listing" value={s.listingsTotal} href="/admin/listings" />
        <Stat label="Artikel" value={s.articlesTotal} href="/marketing/artikel" />
        <Stat label="Leads" value={s.leadsTotal} href="/admin/leads" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card p-8">
          <h2 className="text-2xl font-extrabold text-ink">Status otomasi</h2>
          <ul className="mt-5 space-y-4 text-lg font-bold text-ink">
            <li className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4">
              Artikel harian
              <span className={daily.enabled !== false ? "text-pine-700" : "text-red-700"}>
                {daily.enabled !== false ? "Aktif" : "Nonaktif"}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4">
              Antrean topik artikel
              <span>{daily.topics?.length || 0}</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4">
              Antrean autopilot listing
              <span>{ap.queue?.length || 0}</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4">
              AI
              <span className={process.env.ANTHROPIC_API_KEY ? "text-pine-700" : "text-red-700"}>
                {process.env.ANTHROPIC_API_KEY ? "Tersambung" : "Offline"}
              </span>
            </li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-2xl font-extrabold text-ink">Aktivitas sistem</h2>
          {jobs.length === 0 ? (
            <p className="mt-5 text-lg font-semibold text-ink-faint">Belum ada aktivitas.</p>
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
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Quick href="/admin" title="Dashboard Agent" />
        <Quick href="/marketing" title="Dashboard Marketing" />
        <Quick href="/" title="Website Publik" />
      </div>
    </div>
  );
}

function Stat({ label, value, href }) {
  return (
    <Link href={href} className="card block p-6 transition hover:-translate-y-1 hover:shadow-lift">
      <div className="text-5xl font-extrabold text-ink">{value}</div>
      <div className="mt-2 text-lg font-bold text-ink-soft">{label}</div>
    </Link>
  );
}

function Quick({ href, title }) {
  return (
    <Link href={href} className="rounded-3xl bg-pine-700 px-6 py-6 text-xl font-extrabold text-paper transition hover:bg-pine-800">
      {title} →
    </Link>
  );
}
