import { NextResponse } from "next/server";

// ============================================================
//  Gerbang akses 3 dashboard berbasis peran:
//   - /admin      + /api/admin  → agent, developer
//   - /marketing  + /api/team   → marketing, developer
//   - /developer  + /api/dev    → developer
//  Sesi: cookie rp_session (HMAC, dibuat /api/auth/session).
//  Fallback lama: cookie rp_admin (password) → peran developer.
// ============================================================

const SESSION_COOKIE = "rp_session";
const LEGACY_COOKIE = "rp_admin";
const ROLE_HOME = { agent: "/admin", marketing: "/marketing", developer: "/developer" };

const RULES = [
  { prefix: "/api/dev", roles: ["developer"], api: true },
  { prefix: "/developer", roles: ["developer"] },
  { prefix: "/api/team", roles: ["marketing", "developer"], api: true },
  { prefix: "/marketing", roles: ["marketing", "developer"] },
  { prefix: "/api/admin", roles: ["agent", "developer"], api: true },
  { prefix: "/admin", roles: ["agent", "developer"] },
];

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifySessionEdge(value, secret) {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    if (bytesToB64url(new Uint8Array(mac)) !== sig) return null;
    const data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Rute publik di dalam area terlindungi
  if (
    pathname.startsWith("/api/admin/login") ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  const rule = RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "rumahplus";
  let session = await verifySessionEdge(req.cookies.get(SESSION_COOKIE)?.value, secret);

  // Fallback login password lama → akses penuh (developer)
  if (!session) {
    const legacy = req.cookies.get(LEGACY_COOKIE)?.value;
    if (legacy && legacy === (process.env.ADMIN_PASSWORD || "rumahplus")) {
      session = { role: "developer", email: "admin", legacy: true };
    }
  }

  if (!session) {
    if (rule.api) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/masuk";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    if (rule.api) return NextResponse.json({ error: "Akses ditolak untuk peran " + session.role }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role] || "/masuk";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/marketing/:path*",
    "/api/team/:path*",
    "/developer/:path*",
    "/api/dev/:path*",
  ],
};
