"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconWand, IconTrash, IconExternal, IconPrint, IconPlay, IconDoc } from "@/components/icons";
import Link from "next/link";

export default function ListingActions({ slug, canImprove = true }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function improve() {
    setBusy("improve");
    const res = await fetch("/api/admin/listings/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const j = await res.json();
    setBusy("");
    if (!res.ok) return alert(j.error || "Gagal");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Hapus listing ini?")) return;
    setBusy("delete");
    await fetch("/api/admin/listings/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setBusy("");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={`/admin/listings/${slug}/edit`} className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-ink/[.05] hover:text-pine-700" title="Edit">
        <IconDoc size={18} />
      </Link>
      <Link href={`/properti/${slug}`} target="_blank" className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-ink/[.05] hover:text-pine-700" title="Lihat">
        <IconExternal size={18} />
      </Link>
      <Link href={`/brosur/${slug}`} target="_blank" className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-ink/[.05] hover:text-pine-700" title="Brosur (cetak/PDF)">
        <IconPrint size={18} />
      </Link>
      <Link href={`/admin/video?slug=${slug}`} className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-ink/[.05] hover:text-pine-700" title="Video sosmed">
        <IconPlay size={18} />
      </Link>
      {canImprove && (
        <button onClick={improve} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-ink/[.05] hover:text-pine-700 disabled:opacity-50" title="Improve with AI">
          <IconWand size={18} />
        </button>
      )}
      <button onClick={remove} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Hapus">
        <IconTrash size={18} />
      </button>
    </div>
  );
}
