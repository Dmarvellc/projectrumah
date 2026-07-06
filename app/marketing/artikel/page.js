import Link from "next/link";
import { allArticles } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import DeleteArticleButton from "@/components/marketing/DeleteArticleButton";

export const metadata = { title: "Artikel Terbit" };
export const dynamic = "force-dynamic";

export default function MarketingArticles() {
  const articles = allArticles();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Artikel Terbit</h1>
        <p className="mt-2 text-lg text-ink-soft">{articles.length} artikel di situs.</p>
      </header>

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((a) => (
          <li key={a.slug} className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
            {a.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.cover} alt="" className="h-44 w-full object-cover" />
            )}
            <div className="p-6">
              <div className="text-base font-bold text-pine-700">{a.category}</div>
              <h2 className="mt-1 line-clamp-2 text-xl font-extrabold text-ink">{a.title}</h2>
              <div className="mt-2 text-base font-semibold text-ink-faint">
                {formatDate(a.date)} · {a.readMinutes} menit
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link href={`/artikel/${a.slug}`} target="_blank" className="text-base font-extrabold text-pine-700 hover:underline">
                  Buka artikel
                </Link>
                {a.source !== "seed" && <DeleteArticleButton slug={a.slug} />}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
