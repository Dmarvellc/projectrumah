// ============================================================
//  RumahPlus — Data Properti & Artikel
// ============================================================

export const SITE = {
  name: "RumahPlus",
  url: "https://www.rumahplus.id",
  tagline: "Properti pilihan, dikurasi dengan cermat.",
  description:
    "RumahPlus menghadirkan koleksi rumah, apartemen, tanah, dan ruko pilihan di kota-kota utama Indonesia — dikurasi langsung, lengkap dengan data jujur dan pendampingan transaksi.",
  phone: "021-5000-1234",
  phoneRaw: "0215000124",
  whatsapp: "6281100002222",
  email: "halo@rumahplus.id",
  address: "Jl. Jenderal Sudirman Kav. 1, Jakarta Pusat 10220",
};

export const PROPERTIES = [
  {
    id: 1,
    slug: "rumah-modern-minimalis-bsd-city",
    title: "Rumah Modern Minimalis 2 Lantai",
    type: "rumah",
    listing: "jual",
    price: 2450000000,
    location: "BSD City, Tangerang Selatan",
    city: "Tangerang",
    lat: -6.301, lng: 106.652,
    bedrooms: 4, bathrooms: 3, carports: 2,
    landSize: 120, buildingSize: 150,
    certificate: "SHM",
    featured: true,
    agent: { name: "Andi Pratama", company: "RumahPlus Curated", phone: "0812-1111-2222", verified: true, rating: 4.9 },
    posted: "2026-06-22",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1000&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80"
    ],
    tags: ["Cluster", "Dekat Sekolah", "One Gate System"],
    description: "Rumah modern minimalis siap huni di kawasan premium BSD City. Desain kontemporer dengan pencahayaan alami yang optimal, tata ruang lapang, dan material berkualitas. Berada di dalam cluster dengan sistem satu gerbang dan keamanan 24 jam, dekat dengan sekolah internasional dan pusat komersial."
  },
  {
    id: 2,
    slug: "apartemen-mewah-view-kota-sudirman",
    title: "Apartemen Mewah View Kota",
    type: "apartemen",
    listing: "sewa",
    price: 8500000,
    priceUnit: "bulan",
    location: "Sudirman, Jakarta Pusat",
    city: "Jakarta",
    lat: -6.208, lng: 106.822,
    bedrooms: 2, bathrooms: 1, carports: 1,
    landSize: 0, buildingSize: 65,
    certificate: "Strata",
    featured: true,
    agent: { name: "Siti Rahma", company: "RumahPlus Curated", phone: "0813-3333-4444", verified: true, rating: 4.7 },
    posted: "2026-06-25",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&q=80"
    ],
    tags: ["Furnished", "City View", "Akses MRT"],
    description: "Apartemen fully furnished di jantung kota Jakarta dengan pemandangan kota yang memukau. Berjarak berjalan kaki ke stasiun MRT, pusat perbelanjaan, dan kawasan perkantoran Sudirman. Cocok untuk profesional yang menghargai kenyamanan dan mobilitas tinggi."
  },
  {
    id: 3,
    slug: "rumah-cluster-asri-cibubur",
    title: "Rumah Cluster Asri dekat Tol",
    type: "rumah",
    listing: "jual",
    price: 980000000,
    location: "Cibubur, Jakarta Timur",
    city: "Jakarta",
    lat: -6.371, lng: 106.901,
    bedrooms: 3, bathrooms: 2, carports: 1,
    landSize: 90, buildingSize: 70,
    certificate: "SHM",
    featured: false,
    agent: { name: "Budi Santoso", company: "RumahPlus Curated", phone: "0814-5555-6666", verified: true, rating: 4.3 },
    posted: "2026-06-18",
    images: [
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1000&q=80",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1000&q=80"
    ],
    tags: ["Cluster", "Dekat Tol", "Bebas Banjir"],
    description: "Hunian nyaman di cluster asri dengan akses mudah ke pintu tol. Lingkungan tenang, bebas banjir, dan ramah keluarga muda. Tata ruang efisien dengan halaman kecil yang dapat dikembangkan."
  },
  {
    id: 4,
    slug: "tanah-kavling-siap-bangun-sentul",
    title: "Tanah Kavling Siap Bangun",
    type: "tanah",
    listing: "jual",
    price: 1200000000,
    location: "Sentul, Bogor",
    city: "Bogor",
    lat: -6.575, lng: 106.852,
    bedrooms: 0, bathrooms: 0, carports: 0,
    landSize: 300, buildingSize: 0,
    certificate: "SHM",
    featured: false,
    agent: { name: "Dewi Lestari", company: "RumahPlus Curated", phone: "0815-7777-8888", verified: true, rating: 4.5 },
    posted: "2026-06-20",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80"
    ],
    tags: ["Pinggir Jalan", "View Gunung", "Investasi"],
    description: "Tanah kavling strategis di kawasan sejuk Sentul dengan pemandangan pegunungan. Berada di pinggir jalan dengan akses kendaraan yang baik. Ideal untuk membangun villa pribadi atau investasi jangka panjang."
  },
  {
    id: 5,
    slug: "ruko-3-lantai-gubeng-surabaya",
    title: "Ruko 3 Lantai Lokasi Strategis",
    type: "ruko",
    listing: "jual",
    price: 3800000000,
    location: "Gubeng, Surabaya",
    city: "Surabaya",
    lat: -7.265, lng: 112.752,
    bedrooms: 0, bathrooms: 2, carports: 2,
    landSize: 100, buildingSize: 270,
    certificate: "SHM",
    featured: true,
    agent: { name: "Hendra Wijaya", company: "RumahPlus Curated", phone: "0816-9999-0000", verified: true, rating: 4.8 },
    posted: "2026-06-24",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1000&q=80"
    ],
    tags: ["Pinggir Jalan Raya", "Cocok Usaha", "Parkir Luas"],
    description: "Ruko tiga lantai di jalan utama Surabaya dengan lalu lintas padat dan visibilitas tinggi. Area parkir luas serta tata ruang fleksibel, ideal untuk kantor, retail, maupun usaha kuliner."
  },
  {
    id: 6,
    slug: "rumah-klasik-dago-bandung",
    title: "Rumah Klasik Bandung Utara",
    type: "rumah",
    listing: "jual",
    price: 1750000000,
    location: "Dago, Bandung",
    city: "Bandung",
    lat: -6.873, lng: 107.617,
    bedrooms: 4, bathrooms: 3, carports: 2,
    landSize: 200, buildingSize: 180,
    certificate: "SHM",
    featured: false,
    agent: { name: "Rina Marlina", company: "RumahPlus Curated", phone: "0817-1212-3434", verified: true, rating: 4.6 },
    posted: "2026-06-15",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000&q=80",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1000&q=80"
    ],
    tags: ["Udara Sejuk", "Halaman Luas", "Kawasan Elite"],
    description: "Rumah berarsitektur klasik di kawasan elite Bandung Utara yang sejuk. Halaman luas dan asri, cocok untuk keluarga yang menginginkan ketenangan dengan tetap dekat ke pusat kota."
  },
  {
    id: 7,
    slug: "apartemen-studio-dekat-kampus-depok",
    title: "Apartemen Studio Dekat Kampus",
    type: "apartemen",
    listing: "sewa",
    price: 3200000,
    priceUnit: "bulan",
    location: "Depok, Jawa Barat",
    city: "Depok",
    lat: -6.402, lng: 106.794,
    bedrooms: 1, bathrooms: 1, carports: 0,
    landSize: 0, buildingSize: 28,
    certificate: "Strata",
    featured: false,
    agent: { name: "Yoga Permana", company: "RumahPlus Curated", phone: "0818-5656-7878", verified: true, rating: 4.1 },
    posted: "2026-06-26",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=80"
    ],
    tags: ["Furnished", "Dekat Kampus UI", "Akses KRL"],
    description: "Studio apartemen praktis dan fungsional untuk mahasiswa maupun pekerja. Lokasi dekat kampus dan stasiun KRL, dengan fasilitas pendukung lengkap di dalam gedung."
  },
  {
    id: 8,
    slug: "villa-mewah-kolam-renang-seminyak",
    title: "Villa Mewah dengan Kolam Renang",
    type: "rumah",
    listing: "jual",
    price: 6500000000,
    location: "Seminyak, Bali",
    city: "Bali",
    lat: -8.690, lng: 115.168,
    bedrooms: 5, bathrooms: 5, carports: 3,
    landSize: 450, buildingSize: 380,
    certificate: "SHM",
    featured: true,
    agent: { name: "Made Sukerta", company: "RumahPlus Curated", phone: "0819-3434-5656", verified: true, rating: 5.0 },
    posted: "2026-06-27",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&q=80"
    ],
    tags: ["Private Pool", "Dekat Pantai", "Tropical Design"],
    description: "Villa mewah bergaya tropis dengan kolam renang pribadi di kawasan Seminyak. Hanya beberapa menit dari pantai, restoran, dan pusat gaya hidup. Properti premium dengan potensi sewa harian yang sangat menarik."
  },
  {
    id: 9,
    slug: "rumah-subsidi-siap-kpr-cikarang",
    title: "Rumah Subsidi Siap KPR",
    type: "rumah",
    listing: "jual",
    price: 185000000,
    location: "Cikarang, Bekasi",
    city: "Bekasi",
    lat: -6.305, lng: 107.152,
    bedrooms: 2, bathrooms: 1, carports: 1,
    landSize: 72, buildingSize: 36,
    certificate: "SHM",
    featured: false,
    agent: { name: "Lia Anggraini", company: "RumahPlus Curated", phone: "0821-7878-9090", verified: true, rating: 4.4 },
    posted: "2026-06-19",
    images: [
      "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=1000&q=80"
    ],
    tags: ["Subsidi", "DP Ringan", "Siap KPR"],
    description: "Rumah subsidi dengan cicilan terjangkau dan uang muka ringan. Pilihan tepat bagi keluarga yang membeli rumah pertama. Dokumen lengkap dan siap proses KPR."
  },
  {
    id: 10,
    slug: "penthouse-eksklusif-scbd",
    title: "Penthouse Eksklusif Rooftop",
    type: "apartemen",
    listing: "jual",
    price: 9800000000,
    location: "SCBD, Jakarta Selatan",
    city: "Jakarta",
    lat: -6.225, lng: 106.808,
    bedrooms: 3, bathrooms: 3, carports: 2,
    landSize: 0, buildingSize: 220,
    certificate: "Strata",
    featured: true,
    agent: { name: "Michael Tanaka", company: "RumahPlus Curated", phone: "0822-1010-2020", verified: true, rating: 4.9 },
    posted: "2026-06-28",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1000&q=80"
    ],
    tags: ["Penthouse", "Private Lift", "Smart Home"],
    description: "Penthouse eksklusif dengan akses lift pribadi dan teknologi smart home terintegrasi. Berada di lantai tertinggi kawasan SCBD dengan panorama kota tanpa halangan. Hunian untuk mereka yang menuntut privasi dan prestise."
  },
  {
    id: 11,
    slug: "townhouse-compact-kemang",
    title: "Townhouse Compact Kemang",
    type: "rumah",
    listing: "sewa",
    price: 6000000,
    priceUnit: "bulan",
    location: "Kemang, Jakarta Selatan",
    city: "Jakarta",
    lat: -6.260, lng: 106.814,
    bedrooms: 3, bathrooms: 2, carports: 1,
    landSize: 84, buildingSize: 110,
    certificate: "SHM",
    featured: false,
    agent: { name: "Putri Amelia", company: "RumahPlus Curated", phone: "0823-3030-4040", verified: true, rating: 4.5 },
    posted: "2026-06-21",
    images: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1000&q=80",
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1000&q=80"
    ],
    tags: ["Furnished", "Kawasan Expat", "Dekat Cafe"],
    description: "Townhouse modern dan terawat di kawasan Kemang yang dinamis. Dekat dengan kafe, restoran, dan komunitas ekspatriat. Cocok untuk profesional muda dan keluarga kecil."
  },
  {
    id: 12,
    slug: "gudang-industri-karawang",
    title: "Gudang Industri Luas",
    type: "ruko",
    listing: "sewa",
    price: 45000000,
    priceUnit: "bulan",
    location: "Karawang, Jawa Barat",
    city: "Karawang",
    lat: -6.302, lng: 107.305,
    bedrooms: 0, bathrooms: 2, carports: 5,
    landSize: 1000, buildingSize: 800,
    certificate: "HGB",
    featured: false,
    agent: { name: "Agus Salim", company: "RumahPlus Curated", phone: "0824-5050-6060", verified: true, rating: 4.0 },
    posted: "2026-06-16",
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&q=80"
    ],
    tags: ["Akses Kontainer", "Dekat Kawasan Industri", "Listrik Besar"],
    description: "Gudang industri lapang dengan akses truk kontainer dan daya listrik besar. Berlokasi di kawasan industri Karawang yang strategis dan mudah dijangkau dari jalan tol."
  }
];

export const CITIES = ["Semua Kota", "Jakarta", "Tangerang", "Bogor", "Depok", "Bekasi", "Bandung", "Surabaya", "Bali", "Karawang"];

export const TYPE_LABELS = {
  rumah: "Rumah",
  apartemen: "Apartemen",
  tanah: "Tanah",
  ruko: "Ruko & Gudang",
};

// Kunci ikon (dipetakan ke komponen SVG di components/icons.js)
export const TYPE_ICON = {
  rumah: "home",
  apartemen: "building",
  tanah: "land",
  ruko: "store",
};

// ============================================================
//  Artikel — mesin konten untuk SEO & lalu lintas organik
// ============================================================

export const ARTICLES = [
  {
    slug: "panduan-kpr-2026",
    title: "Panduan Lengkap KPR 2026: Dari Uang Muka sampai Akad",
    category: "Panduan",
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    excerpt: "Memahami alur KPR, simulasi cicilan, dan dokumen yang wajib disiapkan agar pengajuan disetujui bank pada 2026.",
    author: "Redaksi RumahPlus",
    date: "2026-06-20",
    readMinutes: 7,
    keywords: ["kpr 2026", "syarat kpr", "simulasi cicilan rumah", "dokumen kpr"],
    body: [
      "Kredit Pemilikan Rumah (KPR) masih menjadi jalan utama masyarakat Indonesia untuk memiliki hunian. Di 2026, suku bunga acuan yang relatif stabil membuka peluang besar bagi calon pembeli rumah pertama untuk mengunci cicilan yang terjangkau.",
      "Langkah pertama adalah menyiapkan uang muka. Untuk rumah non-subsidi, uang muka umumnya berkisar 10–20% dari harga properti. Semakin besar uang muka, semakin ringan cicilan bulanan dan semakin kecil total bunga yang Anda bayar sepanjang tenor.",
      "Selanjutnya, pastikan rasio cicilan terhadap penghasilan tidak melebihi 30–40%. Bank menilai kemampuan bayar Anda dari slip gaji, mutasi rekening, dan riwayat kredit pada SLIK OJK. Riwayat kredit yang bersih sangat menentukan persetujuan.",
      "Dokumen yang umum diminta: KTP, Kartu Keluarga, NPWP, slip gaji tiga bulan terakhir, rekening koran, dan surat keterangan kerja. Untuk wiraswasta, siapkan laporan keuangan usaha serta izin usaha yang masih berlaku.",
      "Setelah pengajuan disetujui, tahap akhir adalah akad kredit di hadapan notaris. Pada momen ini Anda menandatangani perjanjian kredit dan akta jual beli. Bacalah seluruh klausul dengan teliti, termasuk skema bunga, denda keterlambatan, dan ketentuan pelunasan dipercepat.",
      "Sebelum memutuskan, gunakan kalkulator simulasi cicilan untuk membandingkan beberapa skenario uang muka dan tenor. Perencanaan yang matang hari ini menentukan kenyamanan finansial Anda selama bertahun-tahun ke depan.",
    ],
  },
  {
    slug: "tren-harga-properti-jabodetabek-2026",
    title: "Tren Harga Properti Jabodetabek 2026: Kawasan Paling Menjanjikan",
    category: "Analisis Pasar",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    excerpt: "Analisis pergerakan harga dan kawasan dengan potensi kenaikan tertinggi sepanjang 2026 di Jabodetabek.",
    author: "Redaksi RumahPlus",
    date: "2026-06-12",
    readMinutes: 6,
    keywords: ["harga properti jabodetabek", "investasi properti 2026", "harga rumah jakarta"],
    body: [
      "Pasar properti Jabodetabek menunjukkan pemulihan yang sehat sepanjang paruh pertama 2026, didorong oleh percepatan pembangunan infrastruktur transportasi massal dan jalan tol baru.",
      "Kawasan koridor LRT dan MRT seperti Cibubur, Bekasi, dan Tangerang Selatan mencatat kenaikan harga tertinggi. Peningkatan konektivitas ke pusat kota membuat kawasan penyangga semakin diminati pembeli end-user maupun investor.",
      "BSD City tetap menjadi primadona dengan ekosistem kota mandiri yang lengkap — kawasan komersial, kampus, dan rumah sakit dalam satu klaster terpadu. Permintaan hunian di sini stabil dengan tingkat hunian yang tinggi.",
      "Bagi investor, properti di sekitar simpul transit menawarkan potensi kenaikan nilai dan imbal hasil sewa yang menarik untuk jangka menengah. Pilih properti dengan legalitas jelas dan akses langsung ke transportasi publik.",
      "Catatan penting: kenaikan harga tidak merata. Lakukan riset perbandingan harga per meter persegi di kawasan yang sama sebelum membeli, dan utamakan lokasi dengan rencana pengembangan infrastruktur yang sudah pasti.",
    ],
  },
  {
    slug: "checklist-survei-rumah-bekas",
    title: "10 Hal Wajib Dicek Saat Survei Rumah Bekas",
    category: "Panduan",
    cover: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&q=80",
    excerpt: "Jangan terburu-buru membeli. Periksa struktur, legalitas, dan lingkungan sebelum menandatangani.",
    author: "Redaksi RumahPlus",
    date: "2026-06-05",
    readMinutes: 5,
    keywords: ["survei rumah bekas", "tips beli rumah second", "cek legalitas rumah"],
    body: [
      "Membeli rumah bekas bisa lebih ekonomis, tetapi menuntut ketelitian ekstra. Berikut hal-hal yang wajib Anda periksa sebelum memutuskan.",
      "Periksa kondisi struktur secara menyeluruh: dinding retak, kebocoran atap, dan tanda kelembapan. Cek pula instalasi listrik dan saluran air apakah masih berfungsi baik tanpa perlu perbaikan besar.",
      "Pastikan legalitas: sertifikat atas nama penjual, Pajak Bumi dan Bangunan yang lunas, serta izin mendirikan bangunan tersedia. Cocokkan luas tanah pada sertifikat dengan kondisi fisik di lapangan.",
      "Amati lingkungan: akses jalan, riwayat banjir, keamanan, dan kedekatan dengan fasilitas umum. Datanglah pada waktu berbeda — pagi dan sore — untuk merasakan suasana sebenarnya.",
      "Terakhir, hitung anggaran renovasi bila diperlukan dan masukkan ke dalam total biaya akuisisi. Rumah bekas yang tampak murah bisa menjadi mahal bila membutuhkan perbaikan besar di kemudian hari.",
    ],
  },
  {
    slug: "rincian-biaya-beli-rumah",
    title: "Rincian Biaya Beli Rumah: Pajak, Notaris, dan BPHTB",
    category: "Panduan",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
    excerpt: "Selain harga rumah, ada biaya tambahan yang sering terlewat. Ketahui rinciannya agar anggaran tidak meleset.",
    author: "Redaksi RumahPlus",
    date: "2026-05-28",
    readMinutes: 6,
    keywords: ["biaya beli rumah", "bphtb", "biaya notaris kpr", "pajak beli rumah"],
    body: [
      "Banyak pembeli pertama terkejut karena total biaya membeli rumah ternyata melebihi harga properti yang tertera. Memahami komponen biaya tambahan sejak awal akan membantu Anda menyiapkan anggaran yang realistis.",
      "Bea Perolehan Hak atas Tanah dan Bangunan adalah pajak pembeli, umumnya sebesar 5% dari nilai transaksi setelah dikurangi nilai tidak kena pajak yang berbeda di tiap daerah. Ini biasanya komponen tambahan terbesar.",
      "Biaya notaris dan Pejabat Pembuat Akta Tanah mencakup pembuatan akta jual beli, balik nama sertifikat, serta pengecekan keabsahan dokumen. Besarnya bervariasi, umumnya berkisar 0,5–1% dari nilai transaksi.",
      "Jika membeli melalui KPR, ada biaya provisi bank, biaya administrasi, asuransi jiwa, asuransi kebakaran, dan biaya appraisal. Tanyakan rincian ini kepada bank sejak awal agar tidak ada kejutan saat akad.",
      "Sebagai aturan praktis, siapkan dana tambahan sekitar 7–10% dari harga rumah untuk seluruh biaya transaksi di luar uang muka. Dengan begitu proses pembelian berjalan lancar tanpa kendala dana di tengah jalan.",
    ],
  },
  {
    slug: "rumah-tapak-vs-apartemen",
    title: "Rumah Tapak vs Apartemen: Mana yang Tepat untuk Anda?",
    category: "Panduan",
    cover: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80",
    excerpt: "Perbandingan jujur soal harga, perawatan, privasi, dan potensi investasi antara rumah tapak dan apartemen.",
    author: "Redaksi RumahPlus",
    date: "2026-05-20",
    readMinutes: 5,
    keywords: ["rumah vs apartemen", "beli apartemen", "investasi hunian"],
    body: [
      "Memilih antara rumah tapak dan apartemen adalah salah satu keputusan terbesar dalam hidup. Keduanya memiliki kelebihan yang berbeda dan cocok untuk gaya hidup yang berbeda pula.",
      "Rumah tapak menawarkan privasi, ruang yang dapat dikembangkan, dan kepemilikan tanah yang nilainya cenderung terus naik. Namun lokasinya biasanya lebih jauh dari pusat kota dan perawatannya menjadi tanggung jawab penuh pemilik.",
      "Apartemen unggul dalam lokasi strategis, fasilitas bersama seperti kolam renang dan keamanan, serta perawatan gedung yang dikelola pengelola. Konsekuensinya ada iuran pengelolaan bulanan dan kepemilikan berbentuk strata title.",
      "Dari sisi investasi, tanah pada rumah tapak memberi apresiasi nilai jangka panjang, sementara apartemen di lokasi prima menawarkan imbal hasil sewa yang lebih likuid dan stabil, terutama dekat kawasan bisnis dan kampus.",
      "Tidak ada jawaban yang benar untuk semua orang. Pertimbangkan prioritas Anda: ruang dan privasi, atau lokasi dan kepraktisan. Sesuaikan dengan tahap hidup, anggaran, dan rencana jangka panjang keluarga.",
    ],
  },
  {
    slug: "tips-investasi-properti-pemula",
    title: "Tips Investasi Properti untuk Pemula yang Realistis",
    category: "Investasi",
    cover: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80",
    excerpt: "Langkah aman memulai investasi properti dengan modal terukur, dari memilih lokasi hingga mengelola sewa.",
    author: "Redaksi RumahPlus",
    date: "2026-05-10",
    readMinutes: 6,
    keywords: ["investasi properti pemula", "cara investasi rumah", "properti untuk disewakan"],
    body: [
      "Investasi properti tetap menjadi favorit karena nilainya yang cenderung stabil dan kemampuannya menghasilkan pendapatan pasif melalui sewa. Namun pemula perlu strategi agar tidak terjebak pada keputusan emosional.",
      "Mulailah dengan menetapkan tujuan: apakah Anda mengejar kenaikan nilai jangka panjang, pendapatan sewa rutin, atau keduanya. Tujuan ini menentukan jenis properti dan lokasi yang sebaiknya Anda pilih.",
      "Lokasi adalah faktor terpenting. Cari kawasan dengan pertumbuhan penduduk, rencana infrastruktur yang jelas, dan permintaan sewa yang tinggi seperti dekat kampus, kawasan industri, atau pusat bisnis.",
      "Hitung imbal hasil sewa secara realistis: pendapatan sewa tahunan dibagi harga properti. Sertakan biaya perawatan, pajak, dan masa kosong tanpa penyewa. Imbal hasil bersih 4–6% per tahun sudah tergolong sehat di kota besar.",
      "Jangan abaikan likuiditas dan dana darurat. Properti tidak mudah dijual cepat, jadi pastikan Anda memiliki cadangan kas untuk menutup cicilan saat properti belum tersewa. Mulai dari satu unit, pelajari prosesnya, lalu kembangkan secara bertahap.",
    ],
  },
];

// ============================================================
//  Helper functions
// ============================================================

export function getProperty(idOrSlug) {
  return PROPERTIES.find(
    (p) => p.slug === idOrSlug || String(p.id) === String(idOrSlug)
  );
}

export function getFeatured() {
  return PROPERTIES.filter((p) => p.featured);
}

export function getArticle(slug) {
  return ARTICLES.find((a) => a.slug === slug);
}

export function relatedProperties(property, limit = 3) {
  if (!property) return [];
  return PROPERTIES.filter(
    (p) => p.id !== property.id && (p.city === property.city || p.type === property.type)
  ).slice(0, limit);
}
