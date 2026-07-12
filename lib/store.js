// ============================================================
//  File-based content store (Node runtime only)
//  Menyatukan data seed (data.js) dengan konten buatan admin/AI.
// ============================================================

import fs from "fs";
import path from "path";
import os from "os";
import { PROPERTIES, ARTICLES, SITE } from "@/data";
import { slugify, shortId } from "@/lib/slug";

// Lokasi tulis: filesystem proyek saat lokal; /tmp saat serverless
// (Vercel read-only kecuali /tmp). Bila FS gagal total → in-memory.
// Catatan: di serverless, data tulis bersifat ephemeral (hilang saat
// instance mati) — untuk produksi sungguhan ganti ke database.
const DIR = process.env.VERCEL ? path.join(os.tmpdir(), "rumahplus") : path.join(process.cwd(), "content");
const FILE = path.join(DIR, "db.json");

const EMPTY = {
  listings: [],
  articles: [],
  leads: [],
  jobs: [],
  hiddenSeeds: [], // slug listing seed yang "dihapus" (disembunyikan)
  users: [],
  clients: [],
  tasks: [],
  settings: {
    // Brand & profil agen — dipakai di listing, PPT, brosur, video, cover.
    brand: {
      brandName: "RumahPlus", // watermark di semua materi
      tagline: "Properti pilihan, dikurasi dengan cermat.",
      agentName: "",
      agentCompany: "",
      agentPhone: "",
      agentEmail: "",
    },
    dailyArticle: {
      enabled: true,
      lastRun: null,
      topics: [
        "Tips memilih perumahan yang tepat untuk keluarga muda",
        "Cara cek keaslian sertifikat tanah sebelum membeli",
        "Strategi menjual rumah agar cepat laku di 2026",
        "Panduan renovasi rumah dengan anggaran terbatas",
        "Kawasan berkembang yang layak dilirik investor properti",
      ],
    },
  },
};

// Cache in-memory: sumber kebenaran setelah hidrasi Blob / fallback FS.
let memDb = null;

// PRODUKSI (Vercel Blob): hidrasi SEKALI saat cold start, sebelum handler
// mana pun berjalan — top-level await menjamin urutannya. Data bertahan
// melewati redeploy; tidak ada lagi listing/leads yang hilang.
import { blobDbEnabled, loadDbFromBlob, saveDbToBlob } from "@/lib/db-blob";
if (blobDbEnabled()) {
  memDb = await loadDbFromBlob();
}

// Membaca TIDAK PERNAH menulis/melempar — aman di filesystem read-only.
export function readDb() {
  if (blobDbEnabled()) {
    return memDb
      ? { ...structuredClone(EMPTY), ...memDb, settings: { ...EMPTY.settings, ...(memDb.settings || {}) } }
      : structuredClone(EMPTY);
  }
  try {
    if (fs.existsSync(FILE)) {
      const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
      return { ...structuredClone(EMPTY), ...raw, settings: { ...EMPTY.settings, ...(raw.settings || {}) } };
    }
  } catch {}
  return memDb ? memDb : structuredClone(EMPTY);
}

export function writeDb(db) {
  memDb = db; // selalu simpan di memori agar konsisten walau FS gagal
  if (blobDbEnabled()) {
    // write-through ke Blob; waitUntil menjaga penulisan selesai
    // walau respons HTTP sudah terkirim (serverless).
    const p = saveDbToBlob(db);
    try {
      const { waitUntil } = require("@vercel/functions");
      waitUntil(p);
    } catch {
      /* lokal: biarkan promise berjalan */
    }
    return;
  }
  try {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch {
    // FS read-only tanpa Blob — andalkan memori (dev darurat).
  }
}

// ---------- Merged public getters ----------

function seedListings(hiddenSeeds = []) {
  const hidden = new Set(hiddenSeeds);
  return PROPERTIES.filter((p) => !hidden.has(p.slug)).map((p) => ({ ...p, status: "published", source: "seed" }));
}

// Seed yang belum disembunyikan (untuk UI "Kelola Listing").
export function visibleSeeds() {
  return seedListings(readDb().hiddenSeeds || []);
}

export function allListings({ publishedOnly = false } = {}) {
  const db = readDb();
  const merged = [...db.listings, ...seedListings(db.hiddenSeeds || [])];
  return publishedOnly ? merged.filter((l) => l.status === "published") : merged;
}

export function getListing(slug) {
  return allListings().find((l) => l.slug === slug || String(l.id) === String(slug));
}

export function relatedListings(listing, limit = 3) {
  if (!listing) return [];
  return allListings({ publishedOnly: true })
    .filter((l) => l.slug !== listing.slug && (l.city === listing.city || l.type === listing.type))
    .slice(0, limit);
}

export function allArticles({ publishedOnly = false } = {}) {
  const db = readDb();
  const seed = ARTICLES.map((a) => ({ ...a, status: "published", source: "seed" }));
  const merged = [...db.articles, ...seed];
  return publishedOnly ? merged.filter((a) => a.status === "published") : merged;
}

export function getArticle(slug) {
  return allArticles().find((a) => a.slug === slug);
}

// ---------- Listing mutations ----------

export function uniqueSlug(base, kind = "listings") {
  const db = readDb();
  const taken = new Set(
    kind === "articles"
      ? [...db.articles.map((a) => a.slug), ...ARTICLES.map((a) => a.slug)]
      : [...db.listings.map((l) => l.slug), ...PROPERTIES.map((p) => p.slug)]
  );
  let slug = slugify(base);
  if (!taken.has(slug)) return slug;
  let i = 2;
  while (taken.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

export function saveListing(listing) {
  const db = readDb();
  const slug = listing.slug || uniqueSlug(listing.title || "properti");
  const record = {
    id: listing.id || "L-" + shortId(),
    slug,
    status: listing.status || "published",
    source: "admin",
    posted: listing.posted || new Date().toISOString().slice(0, 10),
    createdAt: listing.createdAt || new Date().toISOString(),
    ...listing,
    slug,
  };
  const idx = db.listings.findIndex((l) => l.slug === slug);
  if (idx >= 0) db.listings[idx] = { ...db.listings[idx], ...record };
  else db.listings.unshift(record);
  writeDb(db);
  return record;
}

export function deleteListing(slug) {
  const db = readDb();
  const isSeed = PROPERTIES.some((p) => p.slug === slug);
  if (isSeed) {
    // Seed tak bisa dihapus fisik (hardcoded di data.js) → sembunyikan.
    db.hiddenSeeds = Array.from(new Set([...(db.hiddenSeeds || []), slug]));
  } else {
    db.listings = db.listings.filter((l) => l.slug !== slug);
  }
  writeDb(db);
}

// Munculkan kembali semua seed yang disembunyikan.
export function restoreSeeds() {
  const db = readDb();
  db.hiddenSeeds = [];
  writeDb(db);
}

// ---------- Article mutations ----------

export function saveArticle(article) {
  const db = readDb();
  const slug = article.slug || uniqueSlug(article.title || "artikel", "articles");
  const record = {
    slug,
    status: article.status || "published",
    source: "admin",
    author: article.author || "Redaksi RumahPlus",
    date: article.date || new Date().toISOString().slice(0, 10),
    createdAt: article.createdAt || new Date().toISOString(),
    ...article,
    slug,
  };
  const idx = db.articles.findIndex((a) => a.slug === slug);
  if (idx >= 0) db.articles[idx] = { ...db.articles[idx], ...record };
  else db.articles.unshift(record);
  writeDb(db);
  return record;
}

export function deleteArticle(slug) {
  const db = readDb();
  db.articles = db.articles.filter((a) => a.slug !== slug);
  writeDb(db);
}

// ---------- Leads ----------

export function addLead(lead) {
  const db = readDb();
  const record = {
    id: "LD-" + shortId(),
    status: "new",
    createdAt: new Date().toISOString(),
    ...lead,
  };
  db.leads.unshift(record);
  writeDb(db);
  return record;
}

export function listLeads() {
  return readDb().leads;
}

export function updateLead(id, patch) {
  const db = readDb();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx >= 0) {
    db.leads[idx] = { ...db.leads[idx], ...patch };
    writeDb(db);
  }
  return db.leads[idx];
}

// ---------- Jobs (riwayat workflow) ----------

export function addJob(job) {
  const db = readDb();
  const record = { id: "JOB-" + shortId(), createdAt: new Date().toISOString(), ...job };
  db.jobs.unshift(record);
  db.jobs = db.jobs.slice(0, 50);
  writeDb(db);
  return record;
}

export function listJobs() {
  return readDb().jobs;
}

// ---------- Users (akun dashboard, peran: agent | marketing | developer) ----------

export function listUsers() {
  return readDb().users || [];
}

export function countUsers() {
  return (readDb().users || []).length;
}

export function findUser(uid, email) {
  const users = readDb().users || [];
  return users.find((u) => u.uid === uid) || (email ? users.find((u) => u.email === email) : null) || null;
}

export function upsertUser(user) {
  const db = readDb();
  db.users = db.users || [];
  const idx = db.users.findIndex((u) => u.uid === user.uid || (user.email && u.email === user.email));
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...user, role: user.role || db.users[idx].role };
  } else {
    db.users.push({ createdAt: new Date().toISOString(), ...user });
  }
  writeDb(db);
  return db.users[idx >= 0 ? idx : db.users.length - 1];
}

export function updateUser(uid, patch) {
  const db = readDb();
  const idx = (db.users || []).findIndex((u) => u.uid === uid);
  if (idx < 0) return null;
  db.users[idx] = { ...db.users[idx], ...patch };
  writeDb(db);
  return db.users[idx];
}

export function deleteUser(uid) {
  const db = readDb();
  db.users = (db.users || []).filter((u) => u.uid !== uid);
  writeDb(db);
}

// ---------- Clients (manajemen klien agent) ----------

export function listClients() {
  return readDb().clients || [];
}

export function addClient(client) {
  const db = readDb();
  db.clients = db.clients || [];
  const record = {
    id: "C-" + shortId(),
    stage: "prospek",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...client,
  };
  db.clients.unshift(record);
  writeDb(db);
  return record;
}

export function updateClient(id, patch) {
  const db = readDb();
  const idx = (db.clients || []).findIndex((c) => c.id === id);
  if (idx < 0) return null;
  db.clients[idx] = { ...db.clients[idx], ...patch, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.clients[idx];
}

export function deleteClient(id) {
  const db = readDb();
  db.clients = (db.clients || []).filter((c) => c.id !== id);
  writeDb(db);
}

// ---------- Tasks (agenda & pengingat agen) ----------

export function listTasks() {
  return readDb().tasks || [];
}

export function addTask(task) {
  const db = readDb();
  db.tasks = db.tasks || [];
  const record = {
    id: "T-" + shortId(),
    title: "",
    due: null, // YYYY-MM-DD
    done: false,
    kind: "followup", // followup | survei | dokumen | nego | lainnya
    clientId: null,
    leadId: null,
    listingSlug: null,
    notes: "",
    createdAt: new Date().toISOString(),
    ...task,
  };
  db.tasks.unshift(record);
  writeDb(db);
  return record;
}

export function updateTask(id, patch) {
  const db = readDb();
  const idx = (db.tasks || []).findIndex((t) => t.id === id);
  if (idx < 0) return null;
  db.tasks[idx] = { ...db.tasks[idx], ...patch };
  writeDb(db);
  return db.tasks[idx];
}

export function deleteTask(id) {
  const db = readDb();
  db.tasks = (db.tasks || []).filter((t) => t.id !== id);
  writeDb(db);
}

// ---------- Settings ----------

export function getSettings() {
  return readDb().settings;
}

export function updateSettings(patch) {
  const db = readDb();
  db.settings = { ...db.settings, ...patch };
  writeDb(db);
  return db.settings;
}

// ---------- Brand & profil agen ----------

const BRAND_DEFAULT = {
  brandName: "RumahPlus",
  tagline: "Properti pilihan, dikurasi dengan cermat.",
  agentName: "",
  agentCompany: "",
  agentPhone: "",
  agentEmail: "",
};

export function getBrand() {
  return { ...BRAND_DEFAULT, ...(readDb().settings?.brand || {}) };
}

export function updateBrand(patch) {
  const db = readDb();
  db.settings = { ...db.settings, brand: { ...BRAND_DEFAULT, ...(db.settings?.brand || {}), ...patch } };
  writeDb(db);
  return db.settings.brand;
}

// Objek "agent" untuk listing baru, diturunkan dari brand.
export function brandAgent() {
  const b = getBrand();
  return {
    name: b.agentName || b.brandName,
    company: b.agentCompany || b.brandName,
    phone: b.agentPhone || "",
    email: b.agentEmail || "",
    verified: true,
  };
}

// Kontak untuk chrome situs publik (header, footer, tombol WA).
// Pakai brand bila diisi; jika kosong, pakai default SITE.
export function siteContact() {
  const b = getBrand();
  const digits = String(b.agentPhone || "").replace(/\D/g, "");
  return {
    brandName: b.brandName || SITE.name,
    phone: b.agentPhone || SITE.phone,
    phoneRaw: digits || SITE.phoneRaw,
    whatsapp: digits ? "62" + digits.replace(/^0/, "") : SITE.whatsapp,
    email: b.agentEmail || SITE.email,
  };
}

export function stats() {
  const db = readDb();
  return {
    listingsTotal: db.listings.length + PROPERTIES.length,
    listingsAdmin: db.listings.length,
    articlesTotal: db.articles.length + ARTICLES.length,
    articlesAdmin: db.articles.length,
    leadsNew: db.leads.filter((l) => l.status === "new").length,
    leadsTotal: db.leads.length,
    jobs: db.jobs.length,
  };
}
