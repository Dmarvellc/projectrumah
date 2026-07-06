import { allListings, allArticles } from "@/lib/store";
import { SITE } from "@/data";

export const dynamic = "force-dynamic";

export default function sitemap() {
  const base = SITE.url;
  const now = new Date();

  const staticRoutes = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/properti`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/artikel`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/tentang`, changeFrequency: "yearly", priority: 0.4 },
  ].map((r) => ({ ...r, lastModified: now }));

  const properties = allListings({ publishedOnly: true }).map((p) => ({
    url: `${base}/properti/${p.slug}`,
    lastModified: new Date(p.posted || now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const articles = allArticles({ publishedOnly: true }).map((a) => ({
    url: `${base}/artikel/${a.slug}`,
    lastModified: new Date(a.date || now),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...properties, ...articles];
}
