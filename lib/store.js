// ============================================================
//  File-based content store (Node runtime only)
//  Menyatukan data seed (data.js) dengan konten buatan admin/AI.
// ============================================================

import fs from "fs";
import path from "path";
import { PROPERTIES, ARTICLES } from "@/data";
import { slugify, shortId } from "@/lib/slug";

const DIR = path.join(process.cwd(), "content");
const FILE = path.join(DIR, "db.json");

const EMPTY = {
  listings: [],
  articles: [],
  leads: [],
  jobs: [],
  users: [],
  clients: [],
  settings: {
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

function ensure() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(EMPTY, null, 2));
}

export function readDb() {
  ensure();
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return { ...EMPTY, ...raw, settings: { ...EMPTY.settings, ...(raw.settings || {}) } };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function writeDb(db) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

// ---------- Merged public getters ----------

function seedListings() {
  return PROPERTIES.map((p) => ({ ...p, status: "published", source: "seed" }));
}

export function allListings({ publishedOnly = false } = {}) {
  const db = readDb();
  const merged = [...db.listings, ...seedListings()];
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
  db.listings = db.listings.filter((l) => l.slug !== slug);
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
