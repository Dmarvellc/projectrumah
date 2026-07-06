"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadActions({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next = status === "new" ? "contacted" : "new";

  async function toggle() {
    setBusy(true);
    await fetch("/api/admin/leads/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={busy} className="btn-outline py-1.5 text-xs disabled:opacity-50">
      {status === "new" ? "Tandai dihubungi" : "Tandai baru"}
    </button>
  );
}
