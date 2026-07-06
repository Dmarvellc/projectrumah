# RumahPlus

Situs properti **terkurasi** — menampilkan koleksi rumah, apartemen, tanah, dan
ruko milik/kelolaan sendiri. Publik **tidak** memasang iklan di sini; seluruh
listing dikurasi dan diverifikasi sebelum tayang. Dibangun dengan Next.js,
fokus pada desain editorial yang bersih dan SEO yang kuat untuk mendatangkan
pengunjung organik dari artikel dan halaman properti.

## Fitur

- **Katalog & pencarian** — filter status (jual/sewa), tipe, kota, kamar tidur, dan urutan harga.
- **Detail properti** — galeri, spesifikasi, kartu kontak, dan simulasi KPR. URL ramah SEO (`/properti/<slug>`).
- **Artikel & panduan** — mesin konten editorial untuk lalu lintas organik.
- **SEO menyeluruh** — metadata per halaman, Open Graph, `sitemap.xml`, `robots.txt`, dan data terstruktur JSON-LD (Organization, WebSite, Residence/Offer, Article).
- **Studio internal** (`/studio`, tidak ditautkan & di-`noindex`) — alat bantu pemilik untuk menyusun draf deskripsi listing dari foto dan draf artikel.

## Login & Peran

Autentikasi Firebase (Google + email/password) di `/masuk` dan `/daftar`.
Token diverifikasi server-side, sesi disimpan sebagai cookie ber-HMAC
(`SESSION_SECRET`). Tiga peran, tiga dashboard:

| Peran | Dashboard | Isi |
| --- | --- | --- |
| `agent` | `/admin` | Otomasi listing, Studio Listing, Klien (CRM + pencocokan), Marketing Kit, Leads |
| `marketing` | `/marketing` | Studio Artikel (artikel panjang bergambar), otomasi harian, kelola artikel |
| `developer` | `/developer` | Ringkasan sistem + manajemen pengguna & peran |

Pengguna pertama dan `OWNER_EMAIL` otomatis menjadi `developer`; developer bisa
mengakses semua dashboard. Fallback darurat: `/admin/login` dengan
`ADMIN_PASSWORD`. Aktifkan provider Google & Email/Password di Firebase Console
(Authentication → Sign-in method) dan tambahkan domain produksi ke Authorized
domains.

## Dashboard Agent (`/admin`)

Konten yang dibuat tersimpan ke `content/db.json` dan langsung tampil di situs publik.

- **Otomasi (Autopilot)** — tempel spesifikasi mentah (teks bebas / broadcast
  WA, bisa banyak sekaligus dipisah `---`) → sistem otomatis mem-parse data,
  menyusun konten AI, memilih aset visual, membuat materi marketing,
  memublikasikan halaman, dan menyiapkan **PPT properti** yang bisa diunduh
  sekali klik (`GET /api/admin/ppt?slug=...`). Ada antrean spesifikasi yang
  diproses cron harian `GET /api/cron/autopilot` (amankan dengan `CRON_SECRET`).
- **Studio Listing** — workflow agentik multi-tahap: dari spesifikasi + foto →
  (1) analisis konten AI (judul, deskripsi, highlight, SEO) → (2) aset visual
  (galeri terpilih + cover bermerek SVG) → (3) materi marketing → (4) publikasi
  jadi halaman `/properti/<slug>` live → **unduh deck PowerPoint (.pptx)**.
- **Artikel & Otomasi Harian** — generate/publish artikel manual, antrean topik,
  "Jalankan sekarang", dan endpoint cron `GET /api/cron/daily-article`
  (dijadwalkan lewat `vercel.json`; amankan dengan `CRON_SECRET`).
- **Marketing Kit** — caption IG/WA/FB, copy iklan, email blast, hashtag, dan
  cover sosial untuk tiap listing.
- **Leads** — form inquiry di tiap halaman properti → tersimpan → inbox admin
  dengan status (baru/dihubungi).
- **Kelola Listing** — daftar, "Improve with AI" (tulis ulang konten), hapus.
- **Ringkasan** — statistik, aksi cepat, aktivitas & leads terbaru.

Catatan: penyimpanan berbasis file cocok untuk demo/lokal. Untuk produksi
(mis. Vercel, filesystem read-only) ganti `lib/store.js` dengan database, dan
tingkatkan autentikasi admin (saat ini cookie sederhana untuk demo). Stack ini
tidak menghasilkan foto fotorealistik; "aset visual" memilih foto stok relevan
dan membuat cover bermerek.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # opsional: isi ANTHROPIC_API_KEY untuk Studio
npm run dev                  # http://localhost:3000
```

Studio bekerja tanpa kunci API memakai generator draf offline. Bila
`ANTHROPIC_API_KEY` diisi, penyusunan draf di Studio memanfaatkan analisis foto
yang lebih kaya. Fitur ini bersifat **internal** dan tidak ditampilkan ke pengunjung.

## Stack

Next.js 14 (App Router) · React 18 · Tailwind CSS · `@anthropic-ai/sdk` (dipakai
hanya pada rute Studio internal).

## Desain

Identitas editorial: latar kertas hangat, tipografi serif (Spectral) untuk judul
dipadu sans (Plus Jakarta Sans), aksen hijau pinus & kuningan, ikon garis SVG
(tanpa emoji).

## Struktur

```
app/
  page.js                       # Beranda
  properti/page.js              # Katalog + filter
  properti/[slug]/page.js       # Detail properti (JSON-LD)
  artikel/                      # Daftar & detail artikel (JSON-LD)
  tentang/page.js               # Profil & kontak
  studio/page.js                # Alat draf internal (noindex)
  sitemap.js · robots.js        # SEO
  api/generate-description/     # Backend Studio: foto → draf deskripsi
  api/generate-article/         # Backend Studio: draf artikel
components/                     # Header, Footer, kartu, ikon SVG, dll.
lib/ai.js                       # Penyusun draf + fallback offline (internal)
lib/utils.js                    # Format harga, tanggal, KPR
data.js                         # Data properti, artikel, konfigurasi situs
```
