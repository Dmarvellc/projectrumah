"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@/components/icons";

export default function DeleteArticleButton({ slug }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Hapus artikel ini?")) return;
    setBusy(true);
    await fetch("/api/team/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <button onClick={remove} disabled={busy} title="Hapus" className="text-ink-faint transition hover:text-red-700 disabled:opacity-50">
      <IconTrash size={22} />
    </button>
  );
}
