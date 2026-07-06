import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, ROLE_HOME } from "@/lib/session";
import { firebaseConfig } from "@/lib/firebase";
import { findUser, upsertUser, countUsers } from "@/lib/store";

export const runtime = "nodejs";

// POST { idToken } — verifikasi token Firebase ke server Google,
// buat/temukan user lokal + perannya, lalu set cookie sesi.
export async function POST(req) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "idToken wajib" }, { status: 400 });

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    const data = await res.json();
    const fbUser = data.users?.[0];
    if (!res.ok || !fbUser?.localId) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    const email = (fbUser.email || "").toLowerCase();
    const existing = findUser(fbUser.localId, email);

    // Peran: user pertama & OWNER_EMAIL → developer; selainnya default agent.
    const owner = (process.env.OWNER_EMAIL || "").toLowerCase();
    const defaultRole = (owner && email === owner) || countUsers() === 0 ? "developer" : "agent";

    const user = upsertUser({
      uid: fbUser.localId,
      email,
      name: fbUser.displayName || existing?.name || email.split("@")[0],
      photo: fbUser.photoUrl || existing?.photo || "",
      role: existing?.role || defaultRole,
    });

    const response = NextResponse.json({ ok: true, role: user.role, home: ROLE_HOME[user.role] || "/admin" });
    response.cookies.set(SESSION_COOKIE, createSession(user), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 86_400,
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// DELETE — keluar.
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
