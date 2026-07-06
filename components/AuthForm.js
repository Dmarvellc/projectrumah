"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth, googleProvider, initAnalytics } from "@/lib/firebase";

const ERRORS = {
  "auth/invalid-credential": "Email atau password salah.",
  "auth/user-not-found": "Akun tidak ditemukan. Daftar dulu.",
  "auth/wrong-password": "Password salah.",
  "auth/email-already-in-use": "Email sudah terdaftar. Silakan masuk.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/invalid-email": "Format email tidak valid.",
  "auth/popup-closed-by-user": "Jendela Google ditutup sebelum selesai.",
  "auth/operation-not-allowed": "Metode login ini belum diaktifkan di Firebase Console.",
};

export default function AuthForm({ mode = "masuk" }) {
  const router = useRouter();
  const params = useSearchParams();
  const isSignup = mode === "daftar";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    initAnalytics();
  }, []);

  async function establishSession(cred) {
    const idToken = await cred.user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal membuat sesi");
    router.push(params.get("next") || json.home || "/admin");
    router.refresh();
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auth = firebaseAuth();
      let cred;
      if (isSignup) {
        cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password);
      }
      await establishSession(cred);
    } catch (err) {
      setError(ERRORS[err?.code] || String(err?.message || err));
      setBusy(false);
    }
  }

  async function withGoogle() {
    setBusy(true);
    setError("");
    try {
      const cred = await signInWithPopup(firebaseAuth(), googleProvider());
      await establishSession(cred);
    } catch (err) {
      setError(ERRORS[err?.code] || String(err?.message || err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[2rem] border border-ink/10 bg-white p-8 shadow-card sm:p-10">
        <h1 className="text-3xl font-extrabold text-ink">
          {isSignup ? "Buat akun" : "Masuk"}
        </h1>

        <button
          onClick={withGoogle}
          disabled={busy}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-ink/15 bg-white px-6 py-4 text-base font-bold text-ink transition hover:border-ink/40 disabled:opacity-60"
        >
          <GoogleMark /> Lanjut dengan Google
        </button>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="text-sm font-bold text-ink-faint">atau email</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="Nama lengkap"
              autoComplete="name"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="Email"
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="Password"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? "Memproses…" : isSignup ? "Daftar" : "Masuk"}
          </button>
        </form>

        {error && <p className="mt-4 text-base font-semibold text-red-700">{error}</p>}

        <p className="mt-8 text-base font-semibold text-ink-soft">
          {isSignup ? (
            <>Sudah punya akun? <Link href="/masuk" className="font-extrabold text-pine-700 hover:underline">Masuk</Link></>
          ) : (
            <>Belum punya akun? <Link href="/daftar" className="font-extrabold text-pine-700 hover:underline">Daftar</Link></>
          )}
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.4 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.4 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.7-6c-2.1 1.4-4.7 2.3-7.5 2.3-6.3 0-11.6-3.9-13.5-9.4l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
