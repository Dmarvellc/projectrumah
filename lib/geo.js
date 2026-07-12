// ============================================================
//  Geo engine — geocoding lokasi Indonesia tanpa API key.
//  1) Nominatim (OpenStreetMap) server-side dengan User-Agent.
//  2) Fallback: tabel koordinat kota/kawasan utama Indonesia.
//  Juga helper tile OSM untuk peta statis di PPT.
// ============================================================

const CITY_COORDS = {
  "bsd": [-6.302, 106.652], "serpong": [-6.317, 106.664], "bintaro": [-6.276, 106.729],
  "gading serpong": [-6.24, 106.629], "alam sutera": [-6.224, 106.654],
  "tangerang selatan": [-6.289, 106.718], "tangerang": [-6.178, 106.63],
  "jakarta pusat": [-6.186, 106.834], "jakarta selatan": [-6.283, 106.804],
  "jakarta barat": [-6.168, 106.767], "jakarta timur": [-6.264, 106.895],
  "jakarta utara": [-6.121, 106.869], "jakarta": [-6.2, 106.816],
  "kemang": [-6.26, 106.813], "sudirman": [-6.208, 106.822], "menteng": [-6.196, 106.832],
  "kelapa gading": [-6.16, 106.905], "pondok indah": [-6.284, 106.784],
  "kebayoran": [-6.243, 106.783], "senayan": [-6.227, 106.802], "kuningan": [-6.23, 106.83],
  "cibubur": [-6.371, 106.901], "depok": [-6.402, 106.794], "margonda": [-6.381, 106.832],
  "bekasi": [-6.238, 106.975], "summarecon bekasi": [-6.226, 107.001],
  "bogor": [-6.595, 106.816], "sentul": [-6.564, 106.852], "cibinong": [-6.482, 106.854],
  "bandung": [-6.917, 107.619], "dago": [-6.885, 107.613], "setiabudi bandung": [-6.86, 107.595],
  "surabaya": [-7.257, 112.752], "pakuwon": [-7.289, 112.674], "citraland surabaya": [-7.29, 112.63],
  "semarang": [-6.966, 110.417], "yogyakarta": [-7.795, 110.369], "sleman": [-7.716, 110.355],
  "malang": [-7.966, 112.632], "solo": [-7.575, 110.824], "surakarta": [-7.575, 110.824],
  "medan": [3.595, 98.672], "palembang": [-2.976, 104.775], "pekanbaru": [0.507, 101.447],
  "batam": [1.13, 104.053], "makassar": [-5.147, 119.432], "manado": [1.474, 124.842],
  "denpasar": [-8.65, 115.216], "canggu": [-8.648, 115.138], "seminyak": [-8.69, 115.168],
  "ubud": [-8.507, 115.263], "bali": [-8.65, 115.216], "balikpapan": [-1.265, 116.831],
  "samarinda": [-0.494, 117.143], "banjarmasin": [-3.319, 114.591], "pontianak": [-0.026, 109.342],
  "karawang": [-6.322, 107.337], "cikarang": [-6.303, 107.153], "cilegon": [-6.017, 106.054],
  "serang": [-6.11, 106.164], "cimahi": [-6.873, 107.542], "sidoarjo": [-7.447, 112.718],
  "gresik": [-7.156, 112.653], "batu": [-7.87, 112.523],
};

// Cari koordinat dari tabel: kunci terpanjang yang cocok menang.
function lookupCity(location) {
  const q = String(location || "").toLowerCase();
  let best = null;
  for (const [key, [lat, lng]] of Object.entries(CITY_COORDS)) {
    if (q.includes(key) && (!best || key.length > best.key.length)) best = { key, lat, lng };
  }
  return best ? { lat: best.lat, lng: best.lng, source: "table" } : null;
}

// Geocode via Nominatim (gratis, tanpa key; wajib User-Agent, hemat panggilan).
export async function geocode(location) {
  const q = String(location || "").trim();
  if (!q) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "RumahPlus/1.0 (property-site)" }, signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data[0]?.lat) {
        return { lat: Number(data[0].lat), lng: Number(data[0].lon), source: "nominatim" };
      }
    }
  } catch {}
  return lookupCity(q);
}

// Lat/lng → koordinat tile OSM (pecahan) pada zoom tertentu.
export function tileXY(lat, lng, zoom) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

// ------------------------------------------------------------
//  Tempat terdekat NYATA via Overpass (OpenStreetMap) — tanpa API key.
//  Mendeteksi sekolah, RS, mall, stasiun, kampus, dll di sekitar titik,
//  lengkap nama asli + estimasi menit berkendara.
// ------------------------------------------------------------
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Kategori (urut prioritas tampil) + label Indonesia.
const POI_CATS = [
  { label: "Rumah Sakit", prio: 1, m: (t) => t.amenity === "hospital" },
  { label: "Sekolah", prio: 1, m: (t) => t.amenity === "school" },
  { label: "Mall", prio: 1, m: (t) => t.shop === "mall" || t.shop === "department_store" },
  { label: "Transportasi", prio: 2, m: (t) => t.railway === "station" || t.amenity === "bus_station" },
  { label: "Kampus", prio: 2, m: (t) => t.amenity === "university" || t.amenity === "college" },
  { label: "Supermarket", prio: 3, m: (t) => t.shop === "supermarket" },
  { label: "Pasar", prio: 3, m: (t) => t.amenity === "marketplace" },
  { label: "Klinik", prio: 3, m: (t) => t.amenity === "clinic" || t.amenity === "doctors" },
  { label: "Apotek", prio: 4, m: (t) => t.amenity === "pharmacy" },
  { label: "Bank", prio: 4, m: (t) => t.amenity === "bank" },
  { label: "SPBU", prio: 4, m: (t) => t.amenity === "fuel" },
  { label: "Tempat Ibadah", prio: 5, m: (t) => t.amenity === "place_of_worship" },
  { label: "Kuliner", prio: 5, m: (t) => t.amenity === "restaurant" || t.amenity === "cafe" },
];

export async function nearbyPOIs(lat, lng, { radius = 3000, limit = 8 } = {}) {
  if (!lat || !lng) return [];
  const q =
    `[out:json][timeout:20];(` +
    `nwr(around:${radius},${lat},${lng})[amenity~"^(hospital|school|university|college|clinic|doctors|marketplace|fuel|bank|pharmacy|bus_station|place_of_worship|restaurant|cafe)$"];` +
    `nwr(around:${radius},${lat},${lng})[shop~"^(mall|department_store|supermarket)$"];` +
    `nwr(around:${radius},${lat},${lng})[railway=station];` +
    `);out center tags 200;`;

  const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  for (const url of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RumahPlus/1.0" },
        body: "data=" + encodeURIComponent(q),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const items = [];
      const seen = new Set();
      for (const el of data.elements || []) {
        const t = el.tags || {};
        const name = t.name || t["name:id"];
        if (!name || seen.has(name.toLowerCase())) continue;
        const cat = POI_CATS.find((c) => c.m(t));
        if (!cat) continue;
        const plat = el.lat ?? el.center?.lat;
        const plng = el.lon ?? el.center?.lon;
        if (plat == null || plng == null) continue;
        const meters = haversine(lat, lng, plat, plng);
        seen.add(name.toLowerCase());
        items.push({ name, category: cat.label, prio: cat.prio, meters, minutes: Math.max(1, Math.round((meters / 1000) * 2.5)) });
      }
      // Variasi: maks 2 per kategori, urut prioritas lalu jarak.
      items.sort((a, b) => a.prio - b.prio || a.meters - b.meters);
      const perCat = {};
      const picked = [];
      for (const it of items) {
        perCat[it.category] = (perCat[it.category] || 0) + 1;
        if (perCat[it.category] <= 2) picked.push(it);
        if (picked.length >= limit) break;
      }
      picked.sort((a, b) => a.meters - b.meters);
      return picked.map(({ name, category, minutes, meters }) => ({ name, category, minutes, meters: Math.round(meters) }));
    } catch {}
  }
  return [];
}

// Ambil grid tile 2x2 di sekitar titik + posisi marker relatif (0..1).
// Return: { tiles: [{url,row,col}], marker: {fx, fy} }
export function staticMapTiles(lat, lng, zoom = 15) {
  const { x, y } = tileXY(lat, lng, zoom);
  const x0 = Math.floor(x - 0.5);
  const y0 = Math.floor(y - 0.5);
  const tiles = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      tiles.push({ url: `https://tile.openstreetmap.org/${zoom}/${x0 + c}/${y0 + r}.png`, row: r, col: c });
    }
  }
  return { tiles, marker: { fx: (x - x0) / 2, fy: (y - y0) / 2 } };
}
