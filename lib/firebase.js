// Firebase client — auth (Google & email/password) + analytics.
// Config web Firebase memang bersifat publik; keamanan diatur lewat
// Firebase Auth + verifikasi token di server (/api/auth/session).
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBhcAENJdrfeKkjxD2P_pb0du0Z5t8iYeE",
  authDomain: "prodproperty.firebaseapp.com",
  projectId: "prodproperty",
  storageBucket: "prodproperty.firebasestorage.app",
  messagingSenderId: "794933446412",
  appId: "1:794933446412:web:42922fe7e360d9b1e42b29",
  measurementId: "G-S3YBKT44TB",
};

export function firebaseApp() {
  return getApps()[0] || initializeApp(firebaseConfig);
}

export function firebaseAuth() {
  return getAuth(firebaseApp());
}

export function googleProvider() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
}

// Analytics hanya di browser dan bila didukung.
export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) return getAnalytics(firebaseApp());
  } catch {}
  return null;
}
