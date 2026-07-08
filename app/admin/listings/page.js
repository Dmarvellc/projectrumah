import Link from "next/link";
import { readDb, visibleSeeds } from "@/lib/store";
import { PROPERTIES, TYPE_LABELS } from "@/data";
import { formatPrice, formatDate } from "@/lib/utils";
import ListingActions from "@/components/admin/ListingActions";
import RestoreSeedsButton from "@/components/admin/RestoreSeedsButton";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Listing" };

export default function ManageListings() {
  const adminListings = readDb().listings;
  const seeds = visibleSeeds();
  const hiddenCount = PROPERTIES.length - seeds.length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold text-ink">Kelola Listing</h1>
        <Link href="/admin/listings/new" className="btn-primary py-3"><IconPlus size={20} /> Listing baru</Link>
      </div>

      {/* Admin-created */}
      <section className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
        <div className="border-b border-ink/10 px-6 py-5">
          <h2 className="text-xl font-extrabold text-ink">Dibuat via Studio ({adminListings.length})</h2>
        </div>
        {adminListings.length === 0 ? (
          <p className="px-6 py-8 text-lg font-semibold text-ink-faint">
            Belum ada. Buat listing pertama lewat <Link href="/admin/listings/new" className="font-extrabold text-pine-700">Studio Listing</Link>.
          </p>
        ) : (
          <Table rows={adminListings} />
        )}
      </section>

      {/* Seed — kini bisa dihapus (disembunyikan) */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-ink">Katalog bawaan ({seeds.length})</h2>
            <p className="mt-0.5 text-base font-semibold text-ink-faint">Contoh awal. Hapus yang tak diperlukan — bisa dimunculkan lagi kapan saja.</p>
          </div>
          <RestoreSeedsButton hiddenCount={hiddenCount} />
        </div>
        {seeds.length === 0 ? (
          <p className="px-6 py-8 text-lg font-semibold text-ink-faint">Semua katalog bawaan disembunyikan.</p>
        ) : (
          <Table rows={seeds} seed />
        )}
      </section>
    </div>
  );
}

function Table({ rows, seed }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="text-left text-base font-extrabold text-ink-faint">
            <th className="px-6 py-4">Judul</th>
            <th className="px-4 py-4">Tipe</th>
            <th className="px-4 py-4">Harga</th>
            <th className="px-4 py-4">Tanggal</th>
            <th className="px-4 py-4">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {rows.map((p) => (
            <tr key={p.slug} className="hover:bg-ink/[.015]">
              <td className="px-6 py-4">
                <Link href={`/properti/${p.slug}`} target="_blank" className="text-lg font-bold text-ink hover:text-pine-700">{p.title}</Link>
                <div className="text-base font-semibold text-ink-faint">{p.location}</div>
              </td>
              <td className="px-4 py-4 text-lg font-semibold text-ink-soft">{TYPE_LABELS[p.type]}</td>
              <td className="px-4 py-4 text-lg font-extrabold text-pine-700">{formatPrice(p.price, p.listing, p.priceUnit)}</td>
              <td className="px-4 py-4 text-base font-semibold text-ink-faint">{formatDate(p.posted)}</td>
              <td className="px-4 py-4"><ListingActions slug={p.slug} canImprove={!seed} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
