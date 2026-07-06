"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(sp.get("next") || "/admin");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Gagal masuk");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-card">
        <div className="font-serif text-2xl font-bold text-ink">
          Rumah<span className="text-pine-600">Plus</span>
        </div>
        <p className="mt-1 text-sm text-ink-faint">Dashboard Admin</p>

        <div className="mt-6">
          <span className="label">Password</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-5 w-full disabled:opacity-60">
          {loading ? "Memeriksa…" : "Masuk"}
        </button>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Demo: password default <code className="font-mono">rumahplus</code>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
