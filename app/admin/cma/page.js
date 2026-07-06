import CmaStudio from "@/components/admin/CmaStudio";
import { allListings } from "@/lib/store";

export const metadata = { title: "Harga & Pasar" };
export const dynamic = "force-dynamic";

export default function CmaPage() {
  const listings = allListings({ publishedOnly: true }).map((l) => ({ slug: l.slug, title: l.title }));
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Harga & Pasar</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Analisis harga berbasis pembanding nyata (CMA): rentang wajar, ruang nego, estimasi lama terjual, dan argumen untuk memenangkan mandat jual.
        </p>
      </header>
      <CmaStudio listings={listings} />
    </div>
  );
}
