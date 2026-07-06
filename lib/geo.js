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
