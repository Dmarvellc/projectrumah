import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticle, allArticles } from "@/lib/store";
import { articleText } from "@/lib/articles";
import { SITE } from "@/data";
import { formatDate } from "@/lib/utils";
import { IconArrow } from "@/components/icons";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }) {
  const a = getArticle(params.slug);
  if (!a) return { title: "Artikel tidak ditemukan" };
  return {
    title: a.title,
    description: a.excerpt,
    keywords: a.keywords,
    alternates: { canonical: `/artikel/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.excerpt,
      images: [{ url: a.cover }],
      url: `${SITE.url}/artikel/${a.slug}`,
      publishedTime: a.date,
    },
  };
}

export default function ArticleDetail({ params }) {
  const a = getArticle(params.slug);
  if (!a) notFound();
  const others = allArticles({ publishedOnly: true }).filter((x) => x.slug !== a.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    image: [a.cover],
    datePublished: a.date,
    dateModified: a.date,
    author: { "@type": "Organization", name: a.author },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    mainEntityOfPage: `${SITE.url}/artikel/${a.slug}`,
    articleBody: articleText(a.body).join("\n\n"),
    keywords: (a.keywords || []).join(", "),
  };

  return (
    <article className="container-x py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-ink-faint">
        <Link href="/" className="hover:text-pine-700">Beranda</Link>
        <span className="mx-2">/</span>
        <Link href="/artikel" className="hover:text-pine-700">Artikel</Link>
      </nav>

      <div className="mx-auto max-w-3xl">
        <span className="eyebrow">{a.category}</span>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
          {a.title}
        </h1>
        <div className="mt-4 text-sm text-ink-faint">
          Oleh {a.author} · {formatDate(a.date)} · {a.readMinutes} menit baca
        </div>
      </div>

      <div className="relative mx-auto mt-8 aspect-[16/9] max-w-4xl overflow-hidden rounded-3xl bg-ink/5">
        <Image src={a.cover} alt={a.title} fill sizes="(max-width:768px) 100vw, 900px" className="object-cover" priority />
      </div>

      <div className="article-body mx-auto mt-12 max-w-prose">
        {a.body.map((block, i) => {
          if (typeof block === "string") return <p key={i}>{block}</p>;
          if (block.t === "h2")
            return (
              <h2 key={i} className="mb-4 mt-10 font-serif text-2xl font-bold text-ink first:mt-0">
                {block.text}
              </h2>
            );
          if (block.t === "img")
            return (
              <span key={i} className="relative my-8 block aspect-[16/9] overflow-hidden rounded-3xl bg-ink/5">
                <Image src={block.src} alt={block.alt || a.title} fill sizes="(max-width:768px) 100vw, 680px" className="object-cover" />
              </span>
            );
          return <p key={i}>{block.text}</p>;
        })}
      </div>

      {others.length > 0 && (
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-8 font-serif text-2xl font-semibold text-ink">Baca juga</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/artikel/${o.slug}`} className="group rounded-2xl border border-ink/10 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <span className="eyebrow">{o.category}</span>
                <h3 className="mt-2 line-clamp-3 font-serif text-lg font-semibold text-ink">{o.title}</h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pine-700">
                  Baca <IconArrow size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
