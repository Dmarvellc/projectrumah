"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@/components/icons";

export default function RowDelete({ endpoint, slug, label = "item ini" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Hapus ${label}?`)) return;
    setBusy(true);
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Hapus">
      <IconTrash size={16} />
    </button>
  );
}
