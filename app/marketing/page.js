import Link from "next/link";
import ArticleStudio from "@/components/marketing/ArticleStudio";
import { getSettings, allArticles } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Studio Artikel" };
export const dynamic = "force-dynamic";

export default function MarketingHome() {
  const daily = getSettings().dailyArticle || {};
  const recent = allArticles().slice(0, 5);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Studio Artikel</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Mesin konten tim marketing: artikel panjang, bergambar, dan berbobot — ditulis AI, terbit otomatis.
        </p>
      </header>

      <ArticleStudio initialDaily={daily} />

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink">Terbaru</h2>
          <Link href="/marketing/artikel" className="text-base font-extrabold text-pine-700 hover:underline">
            Semua artikel
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-white shadow-card">
          {recent.map((a) => (
            <li key={a.slug} className="flex items-center gap-5 px-6 py-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-bold text-ink">{a.title}</div>
                <div className="text-base font-semibold text-ink-faint">{a.category} · {formatDate(a.date)}</div>
              </div>
              <Link href={`/artikel/${a.slug}`} target="_blank" className="shrink-0 text-base font-extrabold text-pine-700 hover:underline">
                Buka
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
