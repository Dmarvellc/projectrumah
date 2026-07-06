"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconWand, IconTrash, IconExternal } from "@/components/icons";
import Link from "next/link";

export default function ListingActions({ slug }) {
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
      <Link href={`/properti/${slug}`} target="_blank" className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/[.05] hover:text-pine-700" title="Lihat">
        <IconExternal size={16} />
      </Link>
      <button onClick={improve} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/[.05] hover:text-pine-700 disabled:opacity-50" title="Improve with AI">
        <IconWand size={16} />
      </button>
      <button onClick={remove} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Hapus">
        <IconTrash size={16} />
      </button>
    </div>
  );
}
