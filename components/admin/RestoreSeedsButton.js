"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestoreSeedsButton({ hiddenCount }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!hiddenCount) return null;

  async function restore() {
    setBusy(true);
    await fetch("/api/admin/listings/restore-seeds", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={restore} disabled={busy} className="text-base font-extrabold text-pine-700 hover:underline disabled:opacity-50">
      {busy ? "Memunculkan…" : `Munculkan ${hiddenCount} yang disembunyikan`}
    </button>
  );
}
