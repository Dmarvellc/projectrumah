import { notFound } from "next/navigation";
import Link from "next/link";
import ListingEditor from "@/components/admin/ListingEditor";
import { getListing } from "@/lib/store";
import { IconArrow } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Listing" };

export default function EditListingPage({ params }) {
  const listing = getListing(params.slug);
  if (!listing) notFound();

  return (
    <div>
      <header className="mb-8">
        <Link href="/admin/listings" className="mb-3 inline-flex items-center gap-2 text-base font-extrabold text-pine-700 hover:underline">
          <IconArrow size={18} className="rotate-180" /> Kembali ke Kelola Listing
        </Link>
        <h1 className="text-4xl font-extrabold text-ink">Edit Listing</h1>
        <p className="mt-2 text-lg text-ink-soft">{listing.title}</p>
      </header>
      <ListingEditor listing={listing} />
    </div>
  );
}
