import AutopilotStudio from "@/components/admin/AutopilotStudio";
import { getAutopilotSettings } from "@/lib/autopilot";
import { listJobs } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Otomasi" };
export const dynamic = "force-dynamic";

export default function OtomasiPage() {
  const ap = getAutopilotSettings();
  const jobs = listJobs().filter((j) => j.type === "autopilot").slice(0, 8);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Otomasi</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Tempel spesifikasi mentah — sistem mengerjakan sisanya sampai halaman terbit dan PPT siap unduh.
        </p>
      </header>

      <AutopilotStudio initialQueue={ap.queue} />

      {jobs.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-ink">Riwayat otomasi</h2>
          <ul className="mt-3 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white shadow-card">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{j.title}</div>
                  <div className="text-xs text-ink-faint">
                    {timeAgo(j.createdAt)} · {j.aiUsed ? "AI" : "Offline"}
                  </div>
                </div>
                <Link href={j.result} target="_blank" className="shrink-0 text-xs font-semibold text-pine-700 hover:underline">
                  Lihat halaman
                </Link>
                <a href={`/api/admin/ppt?slug=${encodeURIComponent(j.slug)}`} className="shrink-0 text-xs font-semibold text-pine-700 hover:underline">
                  Unduh PPT
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
