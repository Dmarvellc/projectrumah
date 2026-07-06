// Sesi berbasis cookie ber-HMAC (Node runtime).
// Payload: { uid, email, name, role, exp } — ditandatangani SESSION_SECRET.
import crypto from "crypto";

export const SESSION_COOKIE = "rp_session";
export const ROLES = ["agent", "marketing", "developer"];
export const ROLE_HOME = { agent: "/admin", marketing: "/marketing", developer: "/developer" };

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "rumahplus";
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

export function createSession(user, days = 14) {
  const payload = b64url(
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.name || "",
      role: user.role || "agent",
      exp: Date.now() + days * 86_400_000,
    })
  );
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(value) {
  if (!value) return null;
  const [payload, sig] = String(value).split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}
