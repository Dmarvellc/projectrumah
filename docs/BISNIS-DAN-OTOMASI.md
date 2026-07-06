# RumahPlus — Analisis Bisnis & Otomasi (mendalam)

Dokumen ini membedah **bagaimana bisnis agen properti sebenarnya menghasilkan
uang**, di mana titik bocornya, dan bagaimana setiap fitur di sistem ini
menyerang titik itu — bukan sebagai "alat bantu", tapi sebagai mesin yang
membuat satu agen bekerja seperti satu tim.

---

## 1. Unit ekonomi: dari mana uangnya

Agen properti Indonesia hidup dari **komisi** — umumnya **2–3% untuk jual**,
**5–8% (setara 1 bulan sewa) untuk sewa**. Angka kasarnya:

| Transaksi | Komisi 2,5% | Yang dibutuhkan untuk 1 closing |
| --- | --- | --- |
| Rumah Rp 1,5 M | Rp 37,5 Jt | ~10–20 lead → 3–5 survei → 1 closing |
| Rumah Rp 3,4 M | Rp 85 Jt | idem, tapi buyer lebih selektif |

Artinya penghasilan agen = **Jumlah listing × Rasio konversi × Nilai komisi ×
Kecepatan siklus**. Empat pengungkit itu yang jadi target seluruh sistem.

**Funnel yang sebenarnya:**

```
Mandat (dapat izin jual)  →  Listing tayang  →  Eksposur/traffic  →
Lead masuk  →  Respons cepat  →  Survei  →  Nego  →  Closing
```

Setiap panah adalah tempat uang bocor. Mari bedah per tahap.

---

## 2. Titik bocor & pengungkitnya

### Bocor #1 — Gagal dapat mandat (kalah di listing presentation)
Pemilik memberi rumahnya ke agen yang terlihat **paling meyakinkan soal harga
dan pemasaran**. Agen biasa datang dengan tebakan harga. Kalah.
→ **Pengungkit: CMA / Mesin Harga.** Datang dengan analisis pembanding nyata,
rentang wajar, ruang nego, estimasi lama terjual, dan argumen berbasis data.
Di negara maju (Compass, HouseCanary) ini adalah senjata #1 pemenang mandat.

### Bocor #2 — Listing lama & jelek (harga salah, materi seadanya)
Listing overpriced jadi "basi", listing dengan 3 kalimat + foto gelap tak
diklik. → **Pengungkit: Studio Listing + Otomasi.** Harga divalidasi CMA,
materi premium (5 selling point multi-sudut, foto cover pilihan AI, halaman
SEO, PPT) selesai dalam ~2 menit.

### Bocor #3 — Eksposur rendah (tak ada yang lihat)
→ **Pengungkit: SEO + Marketing Kit + Artikel harian.** Halaman terindeks
Google, caption semua kanal siap tempel, artikel panjang menarik traffic
organik yang jadi lead gratis.

### Bocor #4 — Lead datang tapi lambat direspons (paling mahal)
Riset klasik (Harvard Business Review / MIT Lead Response): merespons dalam
**5 menit** vs 30 menit menaikkan peluang kontak **~100×**. Agen biasa balas
berjam-jam kemudian. → **Pengungkit: Lead Intelligence.** Setiap lead dinilai
(panas/hangat/dingin + skor), langkah berikutnya jelas, dan **draf follow-up
WA personal H+0/H+1/H+3 sudah jadi** — tinggal klik "Kirim".

### Bocor #5 — Buyer tak cocok / agen lupa follow-up
Pipeline berantakan, prospek hangat menguap. → **Pengungkit: CRM Klien +
Matching + Proyeksi Komisi.** Preferensi klien dicocokkan otomatis ke listing;
pipeline Prospek→Closing dengan **proyeksi komisi tertimbang** membuat agen
fokus ke deal bernilai tertinggi.

### Bocor #6 — Nego kalah (buka harga asal, tak ada lantai)
→ **Pengungkit: strategi nego dari CMA.** Anchor tinggi + walk-away price +
konsesi non-harga (take-over furnitur, fleksibilitas KPR), semua berbasis data
pembanding.

---

## 3. Peta fitur → pengungkit bisnis

| Fitur | Tahap funnel | Pengungkit | Analog global |
| --- | --- | --- | --- |
| **CMA / Harga & Pasar** | Mandat, Nego | Menang mandat + harga benar | Compass, HouseCanary, KW Command |
| **Studio Listing + Otomasi** | Listing | Kecepatan + kualitas | Compass AI descriptions |
| **Foto AI (cover + caption)** | Listing, Eksposur | CTR foto | Zillow media research, virtual staging |
| **Peta titik + analisis kawasan** | Eksposur, Trust | Kepercayaan buyer | Redfin, Zillow maps |
| **PPT presentasi** | Mandat, Closing | Profesionalitas | Listing presentation KW/RE-MAX |
| **Marketing Kit** | Eksposur | Multi-kanal instan | Ylopo, Luxury Presence |
| **Artikel harian** | Eksposur | Traffic organik | HomeLight/NerdWallet content engine |
| **Lead Intelligence** | Respons cepat | Konversi lead | Follow Up Boss, kunci "speed to lead" |
| **CRM + Matching** | Buyer fit | Tak ada prospek hilang | Follow Up Boss, KW Command |
| **Proyeksi Komisi** | Fokus deal | Manajemen pipeline | Salesforce forecasting |

---

## 4. Moat: kenapa sulit ditiru

1. **Konsistensi mustahil manual.** Setiap listing tampil selevel developer
   besar, tiap lead dibalas <5 menit, tiap hari ada konten baru. Agen manual
   tidak bisa mempertahankan ini di 30+ listing sekaligus.
2. **Efek data.** Makin banyak listing di katalog → CMA makin akurat
   (pembanding lebih banyak) → harga makin tepat → makin sering menang mandat →
   makin banyak listing. Roda gila (flywheel).
3. **Biaya marjinal ≈ 0.** Routing model (Haiku untuk tugas mekanis, Sonnet
   untuk analisis) membuat setiap listing/lead diproses dengan biaya sangat
   rendah — kompetitor yang menyewa tim copywriter/analis tak bisa menyaingi
   struktur biaya ini.

---

## 5. Arsitektur otomasi (sistem)

```
INPUT            OTAK AI (routing model)          OUTPUT
─────            ───────────────────────          ──────
Spesifikasi  ┐   parseSpec (Haiku, murah)      →  data terstruktur
+ Foto       ┼─► generateListing (Sonnet)      →  copy + 5 selling point + cover
WA broadcast ┘   generateLocationInsight       →  strategis + tempat terdekat
                 geocode (OSM, gratis)         →  titik peta
                 generateMarketing (Haiku)     →  IG/WA/FB/email/iklan
                                                → Halaman SEO + PPT 7-slide

Lead masuk   ──► analyzeLead (Haiku)           →  skor + follow-up H0/H1/H3
Subjek harga ──► generateCMA (Sonnet)          →  rentang wajar + nego + mandat

CRON (Vercel):
  01:00  /api/cron/daily-article   → 1 artikel SEO panjang
  02:00  /api/cron/autopilot       → 1 listing dari antrean
```

**Prinsip efisiensi biaya:** tugas mekanis (parsing, copy pendek, skor lead) →
model cepat/murah; tugas bernalar (analisis foto, kawasan, harga, artikel) →
model pintar. Fallback antar-model → pipeline tak pernah mati.

---

## 6. KPI yang harus dipantau

| Metrik | Kenapa | Target sehat |
| --- | --- | --- |
| **Speed-to-lead** | Penentu konversi #1 | < 5 menit (pakai draf WA) |
| **Mandat menang / presentasi** | Sumber listing | > 50% dengan CMA |
| **Listing → lead (per bulan)** | Efektivitas eksposur | naik tiap bulan |
| **Lead → survei** | Kualitas follow-up | > 20% |
| **Survei → closing** | Kualitas matching/nego | > 25% |
| **Hari sampai terjual** | Ketepatan harga | mendekati estimasi CMA |
| **Nilai pipeline & proyeksi komisi** | Kesehatan bisnis | tumbuh + prediktif |

---

## 7. Tools pihak ketiga (urut prioritas)

**Sudah dipakai (gratis/murah):** Anthropic API (otak), Firebase Auth,
OpenStreetMap/Nominatim (peta+geocoding, tanpa biaya), Vercel (host+cron).

1. **WhatsApp Business API** (Twilio/Qontak/Mekari) — kirim follow-up otomatis
   & auto-reply <1 menit. Draf sudah dibuat sistem; tinggal jalur kirimnya.
2. **Google Business Profile** (gratis) — review & kepercayaan lokal.
3. **Meta Ads** — pakai `targetBuyers` sebagai audiens, copy sudah jadi.
4. **Virtual staging AI** (Collov/REimagine) — isi furnitur virtual foto kosong.
5. **Email (Resend/Mailchimp)** — email blast dari Marketing Kit.
6. **Database (Supabase/Postgres)** — saat listing >100 / multi-agent.

---

## 8. Roadmap AI berikutnya

- **Auto-reply WA + follow-up terjadwal** — eksekusi otomatis draf yang sudah dibuat.
- **CMA → PPT** — sisipkan slide analisis harga ke deck untuk listing presentation.
- **Lead nurturing sequence** — jalankan H0/H1/H3 otomatis, berhenti saat dibalas.
- **Prediksi "kapan & berapa dijual"** dari tren leads + artikel.
- **Dashboard analitik funnel** — konversi per tahap, sumber lead, ROI kanal.
- **Multi-agent** — pembagian lead, papan peringkat, komisi per agen.
```
