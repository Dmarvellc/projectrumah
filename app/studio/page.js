import ListingGenerator from "@/components/ListingGenerator";
import ArticleGenerator from "@/components/ArticleGenerator";

export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

// Alat bantu internal pemilik untuk menyusun draf listing & artikel.
// Tidak ditautkan di navigasi publik dan diblokir dari mesin pencari.
export default function StudioPage() {
  return (
    <div className="container-x py-12">
      <header className="max-w-2xl">
        <span className="eyebrow">Internal</span>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl">Studio Konten</h1>
        <p className="mt-2 text-ink-soft">
          Alat bantu menyusun draf deskripsi listing dari foto, serta draf artikel.
          Hasil bersifat draf — tinjau dan sunting sebelum dipublikasikan.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">Draf listing</h2>
        <ListingGenerator />
      </section>

      <section className="mt-16">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">Draf artikel</h2>
        <ArticleGenerator />
      </section>
    </div>
  );
}
