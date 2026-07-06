import Link from "next/link";
import { readDb } from "@/lib/store";
import { PROPERTIES, TYPE_LABELS } from "@/data";
import { formatPrice, formatDate } from "@/lib/utils";
import ListingActions from "@/components/admin/ListingActions";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Listing" };

export default function ManageListings() {
  const adminListings = readDb().listings;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Konten</span>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Kelola Listing</h1>
        </div>
        <Link href="/admin/listings/new" className="btn-primary py-2.5"><IconPlus size={17} /> Listing baru</Link>
      </div>

      {/* Admin-created */}
      <section className="rounded-2xl border border-ink/10 bg-white shadow-card">
        <div className="border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold text-ink">Dibuat via Studio ({adminListings.length})</h2>
        </div>
        {adminListings.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-faint">
            Belum ada. Buat listing pertama lewat <Link href="/admin/listings/new" className="font-semibold text-pine-700">Studio Listing</Link>.
          </p>
        ) : (
          <Table rows={adminListings} editable />
        )}
      </section>

      {/* Seed */}
      <section className="mt-8 rounded-2xl border border-ink/10 bg-white shadow-card">
        <div className="border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold text-ink">Katalog bawaan ({PROPERTIES.length})</h2>
          <p className="text-xs text-ink-faint">Data seed — hanya baca.</p>
        </div>
        <Table rows={PROPERTIES} />
      </section>
    </div>
  );
}

function Table({ rows, editable }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-ink-faint">
            <th className="px-6 py-3 font-semibold">Judul</th>
            <th className="px-4 py-3 font-semibold">Tipe</th>
            <th className="px-4 py-3 font-semibold">Harga</th>
            <th className="px-4 py-3 font-semibold">Tanggal</th>
            {editable && <th className="px-4 py-3 font-semibold">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {rows.map((p) => (
            <tr key={p.slug} className="hover:bg-ink/[.015]">
              <td className="px-6 py-3">
                <Link href={`/properti/${p.slug}`} target="_blank" className="font-medium text-ink hover:text-pine-700">{p.title}</Link>
                <div className="text-xs text-ink-faint">{p.location}</div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{TYPE_LABELS[p.type]}</td>
              <td className="px-4 py-3 font-semibold text-pine-700">{formatPrice(p.price, p.listing, p.priceUnit)}</td>
              <td className="px-4 py-3 text-ink-faint">{formatDate(p.posted)}</td>
              {editable && (
                <td className="px-4 py-3"><ListingActions slug={p.slug} /></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
