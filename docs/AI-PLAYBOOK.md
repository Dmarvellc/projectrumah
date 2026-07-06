# RumahPlus AI Playbook — AI Sebagai Kunci Sukses Agent

> AI di sini bukan pembantu. Ia adalah mesin yang membuat satu agent bekerja
> seperti satu tim: analis kawasan, copywriter, fotografer editor, marketer,
> dan asisten follow-up — berjalan otomatis 24 jam.

## 1. Apa yang dilakukan pemain sukses di luar negeri (dan versi kita)

| Praktik terbukti | Siapa yang memakainya | Versi RumahPlus (sudah terpasang) |
| --- | --- | --- |
| Listing copy AI dari foto + data, bukan template | Compass (AI listing descriptions), Zillow | Studio Listing: AI membedah foto satu per satu, menulis 4–5 paragraf + selling points 5 aspek |
| "Likely to sell" & data kawasan menjadi senjata jualan | Compass, Opendoor | Analisis lokasi AI: kenapa strategis, tempat terdekat + estimasi menit, tersimpan di halaman & PPT |
| Foto adalah 80% keputusan klik — kurasi ketat | Zillow research, Redfin | AI memilih foto cover terbaik + caption per foto; foto asli penjual dipakai, bukan stok |
| Presentasi listing profesional untuk pemilik (listing presentation) | Keller Williams, RE/MAX | PPT otomatis 7 slide: cover, galeri ber-caption, spesifikasi lengkap, peta + sekitar, selling points, deskripsi, kontak |
| Marketing multi-kanal dari satu sumber | Ylopo, Luxury Presence | Marketing Kit: caption IG/FB, broadcast WA, iklan, email — satu klik per listing |
| Konten SEO rutin untuk organic leads | HomeLight, NerdWallet model | Dashboard Marketing: artikel 1200+ kata bergambar, terbit otomatis harian dari antrean topik |
| CRM pipeline + matching otomatis | Follow Up Boss, KW Command | Klien: pipeline Prospek→Closing + pencocokan listing otomatis (budget/tipe/lokasi) |

## 2. Kenapa ini sulit ditiru orang biasa

Agen biasa mengiklankan dengan 3 kalimat dan 5 foto gelap. Ekosistem ini
menghasilkan — untuk SETIAP listing, dalam ±2 menit:

1. **Copy premium 5 paragraf** yang membedah lokasi, bangunan, dan nilai investasi.
2. **Selling points 5 sudut pandang** (lokasi/akses, investasi, keluarga, kondisi, legalitas) — kerangka yang dipakai listing agent top: pembeli berbeda tergerak oleh alasan berbeda.
3. **Target buyer persona** — tahu ke siapa iklan diarahkan.
4. **Halaman web SEO + JSON-LD** yang terindeks Google.
5. **Peta titik + analisis kawasan** yang membuat pembeli percaya angka.
6. **Deck PPT** siap dikirim ke pemilik rumah (memenangkan mandat jual!) atau ke pembeli serius.
7. **Materi iklan semua kanal** siap tempel.

Konsistensi inilah yang membangun kepercayaan: setiap listing tampil selevel
developer besar, dan kompetitor lokal tidak bisa mengejar kecepatannya.

## 3. Bagaimana otomasinya berjalan (sistem)

```
Spesifikasi/foto masuk (form detail ATAU tempel teks WA di Otomasi)
   │
   ├─ Claude menganalisis foto + data + pengetahuan kawasan
   │     → judul, deskripsi, selling points, cover terbaik, caption foto
   ├─ Geocoding (OpenStreetMap/Nominatim, tanpa API key) → titik peta
   ├─ Analisis kawasan AI → strategis + tempat terdekat
   ├─ Foto asli disimpan → galeri (cover pilihan AI di depan)
   ├─ Marketing kit dibuat
   ├─ Halaman /properti/<slug> terbit (SEO lengkap)
   └─ PPT 7-slide siap unduh sekali klik
                                     
Cron harian (Vercel):
   02:00 → /api/cron/autopilot      → antrean spesifikasi jadi listing
   01:00 → /api/cron/daily-article  → satu artikel SEO panjang terbit
```

## 4. Tools pihak ketiga yang disarankan (bertahap)

**Sudah dipakai (gratis/murah):** Anthropic API (otak semua analisis),
Firebase Auth (login Google), OpenStreetMap/Nominatim (peta & geocoding,
tanpa biaya), Vercel (hosting + cron).

**Tahap berikutnya, urut prioritas:**
1. **WhatsApp Business API** (Twilio/Qontak/Mekari, ~ratusan ribu/bln) — balasan otomatis leads <1 menit; riset industri: respons 5 menit pertama menaikkan konversi berkali lipat. AI bisa menyusun draf balasan dari data listing.
2. **Google Business Profile** (gratis) — listing lokasi kantor + review; sumber kepercayaan lokal #1.
3. **Meta Ads** (mulai ~50rb/hari) — caption & copy iklan sudah dibuatkan sistem; tinggal pasang per listing unggulan, targetkan persona dari `targetBuyers`.
4. **Virtual staging AI** (Collov/REimagine, ~$10-30/bln) — furnitur virtual untuk foto ruangan kosong; terbukti menaikkan minat di pasar AS.
5. **Email (Resend/Mailchimp**, gratis di awal) — kirim email blast dari Marketing Kit ke database pembeli.
6. **Database produksi (Supabase/Postgres)** — saat listing >100 atau multi-agent, ganti store file `content/db.json`.

## 5. Roadmap fitur AI berikutnya (sudah dirancang agar mudah ditambah)

- **Lead scoring AI** — nilai keseriusan setiap inquiry dari isi pesannya.
- **CMA otomatis** (Comparative Market Analysis) — bandingkan harga listing dengan pembanding sekitar → alat nego + memenangkan mandat.
- **Follow-up sequence** — draf WA H+1/H+3/H+7 untuk setiap lead, dipersonalisasi dari properti yang diminati.
- **Analisis "kapan dijual"** — rekomendasi timing & harga dari tren artikel/leads.
