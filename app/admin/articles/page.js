import Link from "next/link";
import { readDb, getSettings } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import ArticleManager from "@/components/admin/ArticleManager";
import RowDelete from "@/components/admin/RowDelete";
import { IconExternal } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Artikel & Harian" };

export default function AdminArticles() {
  const articles = readDb().articles;
  const settings = getSettings().dailyArticle;

  return (
    <div>
      <header className="mb-6">
        <span className="eyebrow">Konten & SEO</span>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Artikel & Otomasi Harian</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Terbitkan artikel untuk mendongkrak trafik organik. Buat manual atau
          jalankan otomasi harian dari antrean topik.
        </p>
      </header>

      <ArticleManager initialSettings={settings} />

      <section className="mt-8 rounded-2xl border border-ink/10 bg-white shadow-card">
        <div className="border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold text-ink">Artikel diterbitkan via admin ({articles.length})</h2>
        </div>
        {articles.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-faint">Belum ada artikel dari admin.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {articles.map((a) => (
              <li key={a.slug} className="flex items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/artikel/${a.slug}`} target="_blank" className="font-medium text-ink hover:text-pine-700">{a.title}</Link>
                  <div className="text-xs text-ink-faint">{a.category} · {formatDate(a.date)}</div>
                </div>
                <Link href={`/artikel/${a.slug}`} target="_blank" className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/[.05] hover:text-pine-700"><IconExternal size={16} /></Link>
                <RowDelete endpoint="/api/admin/articles/delete" slug={a.slug} label="artikel" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
