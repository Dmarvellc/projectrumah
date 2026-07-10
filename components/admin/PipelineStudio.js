"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PropertyMap from "@/components/PropertyMap";
import { TYPE_LABELS } from "@/data";
import { formatPrice } from "@/lib/utils";
import { IconWand, IconCheck, IconSlide, IconExternal, IconMega, IconPin, IconHome, IconDoc, IconStar, IconClose, IconPrint } from "@/components/icons";

const STAGES = [
  { key: "content", label: "Analisis AI", desc: "Foto + data → konten, selling points, cover terbaik" },
  { key: "upload", label: "Simpan foto asli", desc: "Foto Anda dipakai di galeri — bukan foto stok" },
  { key: "images", label: "Aset visual", desc: "Galeri tersusun + cover bermerek" },
  { key: "marketing", label: "Materi marketing", desc: "Caption sosial, iklan & email" },
  { key: "publish", label: "Publikasi", desc: "Analisis lokasi, peta & halaman live" },
];

const INITIAL = {
  type: "rumah", listing: "jual",
  location: "", cluster: "", address: "",
  price: "",
  landSize: "", buildingSize: "", floors: "", bedrooms: "", bathrooms: "", carports: "",
  maidRooms: "", garage: "", ipl: "", roadWidth: "",
  yearBuilt: "", electricity: "", water: "", facing: "", furnished: "", condition: "",
  certificate: "SHM", imb: false,
  facilities: [],
  extra: "",
};

const FACILITY_OPTIONS = [
  "Kolam Renang", "Taman", "Gudang", "Kitchen Set", "Water Heater",
  "AC", "CCTV", "Smart Home", "One Gate System", "Solar Panel",
];

// ---------- format harga: 2500000000 → "2.500.000.000" ----------
const fmtID = (digits) => (digits ? Number(digits).toLocaleString("id-ID") : "");
const digitsOnly = (s) => String(s).replace(/\D/g, "");

// Skala 1 foto → dataURL JPEG.
function scaleToDataUrl(img, maxDim, quality) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

// Dua versi: 'data' (medium, untuk galeri) & 'analysisData' (kecil, untuk
// vision AI). Versi analisis sengaja mungil agar request tak pernah 413.
function compressFile(file) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const medium = scaleToDataUrl(img, 1200, 0.72);
      const small = scaleToDataUrl(img, 768, 0.55);
      resolve({
        url: medium,
        media_type: "image/jpeg",
        data: medium.split(",")[1],
        analysisData: small.split(",")[1],
      });
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

export default function PipelineStudio() {
  const [form, setForm] = useState(INITIAL);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState({});
  const [running, setRunning] = useState(false);
  const [listing, setListing] = useState(null);
  const [coverSvg, setCoverSvg] = useState("");
  const [coverIndex, setCoverIndex] = useState(null);
  const [marketing, setMarketing] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [geo, setGeo] = useState(null); // { lat, lng } — bisa digeser manual
  const [pinBusy, setPinBusy] = useState(false);

  async function findPin() {
    const q = [form.cluster, form.location].filter(Boolean).join(", ");
    if (!q) return setError("Isi dulu kawasan/kota di kartu Lokasi.");
    setPinBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: q }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal");
      setGeo({ lat: json.lat, lng: json.lng });
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setPinBusy(false);
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const priceLabel = useMemo(() => {
    const n = Number(digitsOnly(form.price));
    return n > 0 ? `≈ ${formatPrice(n, form.listing)}` : "";
  }, [form.price, form.listing]);

  async function onFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, 12 - images.length);
    const loaded = (await Promise.all(files.map(compressFile))).filter(Boolean);
    setImages((prev) => [...prev, ...loaded].slice(0, 12));
    e.target.value = "";
  }

  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function call(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // Respons bisa non-JSON (mis. 413 "Request Entity Too Large" dari server).
    const raw = await res.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      if (res.status === 413 || /too large|request entity/i.test(raw)) {
        throw new Error("Foto terlalu besar/banyak. Kurangi jumlah foto (coba ≤ 6) lalu jalankan lagi.");
      }
      throw new Error(`Server bermasalah (${res.status}). Coba lagi.`);
    }
    if (!res.ok) throw new Error(json.error || "Gagal");
    return json;
  }

  async function run() {
    setRunning(true);
    setError("");
    setResult(null);
    setStatus({});
    const details = { ...form, price: digitsOnly(form.price), imb: form.imb };
    let assembled = { ...details };

    try {
      // 1. Analisis AI — kirim versi KECIL (analysisData), maks 6 → request mungil, bebas 413
      setStatus((s) => ({ ...s, content: "running" }));
      const content = await call("/api/admin/pipeline/content", {
        details,
        images: images.slice(0, 6).map(({ media_type, analysisData }) => ({ media_type, data: analysisData })),
      });
      assembled = {
        ...assembled,
        title: content.title,
        description: content.description,
        highlights: content.highlights || [],
        sellingPoints: content.sellingPoints || [],
        targetBuyers: content.targetBuyers || [],
        photoCaptions: content.photoCaptions || [],
        tags: content.tags || [],
        seoTitle: content.seoTitle,
      };
      setCoverIndex(content.coverIndex ?? 0);
      setListing({ ...assembled });
      setStatus((s) => ({ ...s, content: "done" }));

      // 2. Simpan foto asli penjual — diunggah BERBATCH (≤3/permintaan)
      //    agar tiap request kecil dan tak pernah melampaui batas body (413).
      setStatus((s) => ({ ...s, upload: "running" }));
      let uploadedUrls = [];
      for (let i = 0; i < images.length; i += 3) {
        const batch = images.slice(i, i + 3).map(({ media_type, data }) => ({ media_type, data }));
        const up = await call("/api/admin/upload", { images: batch });
        uploadedUrls.push(...(up.urls || []));
      }
      setStatus((s) => ({ ...s, upload: "done" }));

      // 3. Galeri (foto asli, cover pilihan AI di depan) + cover bermerek
      setStatus((s) => ({ ...s, images: "running" }));
      const vis = await call("/api/admin/pipeline/images", {
        listing: assembled,
        uploadedUrls,
        coverIndex: content.coverIndex ?? 0,
      });
      assembled = { ...assembled, images: vis.gallery };
      setCoverSvg(vis.coverSvg);
      setListing({ ...assembled });
      setStatus((s) => ({ ...s, images: "done" }));

      // 4. Marketing
      setStatus((s) => ({ ...s, marketing: "running" }));
      const mkt = await call("/api/admin/pipeline/marketing", { listing: assembled });
      setMarketing(mkt);
      setStatus((s) => ({ ...s, marketing: "done" }));

      // 5. Publish (geocode + analisis lokasi terjadi di server)
      setStatus((s) => ({ ...s, publish: "running" }));
      const stageSummary = STAGES.map((st) => ({ name: st.label, status: "done" }));
      const pub = await call("/api/admin/pipeline/publish", { listing: { ...assembled, geo }, marketing: mkt, stages: stageSummary });
      setResult(pub);
      setStatus((s) => ({ ...s, publish: "done" }));
    } catch (err) {
      setError(String(err.message || err));
      setStatus((s) => {
        const cur = Object.keys(s).find((k) => s[k] === "running");
        return cur ? { ...s, [cur]: "error" } : s;
      });
    } finally {
      setRunning(false);
    }
  }

  async function downloadPpt() {
    if (result?.slug) {
      window.location.href = `/api/admin/ppt?slug=${encodeURIComponent(result.slug)}`;
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,560px)_1fr]">
      {/* ===== FORM ===== */}
      <div className="space-y-6">
        {/* FOTO */}
        <FormCard icon={IconStar} title="Foto properti" hint="Foto Anda yang dipakai — AI memilih cover terbaiknya">
          <label className="relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-pine-300 bg-pine-50/60 px-6 py-8 text-center transition hover:bg-pine-50">
            <HouseIllustration />
            <span className="mt-3 text-lg font-extrabold text-pine-700">Unggah foto (maks 12)</span>
            <span className="text-base font-semibold text-ink-faint">Otomatis dikompres — aman untuk banyak foto</span>
            <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
          </label>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className={`aspect-square w-full rounded-2xl object-cover ${coverIndex === i ? "ring-4 ring-pine-600" : ""}`} />
                  {coverIndex === i && (
                    <span className="absolute left-1.5 top-1.5 rounded-lg bg-pine-700 px-2 py-0.5 text-xs font-extrabold text-paper">COVER AI</span>
                  )}
                  <button type="button" onClick={() => removeImage(i)} className="absolute right-1.5 top-1.5 hidden rounded-full bg-ink/80 p-1 text-paper group-hover:block">
                    <IconClose size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormCard>

        {/* LOKASI */}
        <FormCard icon={IconPin} title="Lokasi" hint="Semakin spesifik, semakin tajam analisis kawasan & titik peta">
          <Field label="Kawasan / Kota">
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className="field" placeholder="mis. BSD City, Tangerang Selatan" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cluster / Perumahan">
              <input value={form.cluster} onChange={(e) => set("cluster", e.target.value)} className="field" placeholder="mis. De Park, Nava Park" />
            </Field>
            <Field label="Alamat (opsional)">
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className="field" placeholder="Jl. …" />
            </Field>
          </div>

          {/* TITIK PETA — cari lalu geser pin sampai pas */}
          <div className="rounded-3xl bg-pine-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-extrabold text-ink">Titik peta</div>
              <button type="button" onClick={findPin} disabled={pinBusy} className="btn-outline py-2.5 disabled:opacity-60">
                <IconPin size={20} /> {pinBusy ? "Mencari…" : geo ? "Cari ulang" : "Cari titik dari lokasi"}
              </button>
            </div>
            {geo && (
              <div className="mt-3">
                <PropertyMap
                  single
                  draggable
                  zoom={17}
                  height={300}
                  points={[{ lat: geo.lat, lng: geo.lng }]}
                  onDragEnd={(lat, lng) => setGeo({ lat, lng })}
                />
                <p className="mt-2 text-base font-bold text-pine-700">
                  Geser pin sampai tepat di rumahnya — titik ini dipakai di halaman & PPT.
                </p>
              </div>
            )}
          </div>
        </FormCard>

        {/* HARGA & STATUS */}
        <FormCard icon={IconHome} title="Harga & status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipe">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="field">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.listing} onChange={(e) => set("listing", e.target.value)} className="field">
                <option value="jual">Dijual</option>
                <option value="sewa">Disewakan</option>
              </select>
            </Field>
          </div>
          <Field label="Harga (Rp)">
            <div className="relative">
              <input
                inputMode="numeric"
                value={fmtID(digitsOnly(form.price))}
                onChange={(e) => set("price", digitsOnly(e.target.value))}
                className="field pr-32"
                placeholder="2.500.000.000"
              />
              {priceLabel && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-pine-700 px-3 py-1.5 text-base font-extrabold text-paper">
                  {priceLabel}
                </span>
              )}
            </div>
          </Field>
        </FormCard>

        {/* DIMENSI & RUANG */}
        <FormCard icon={IconHome} title="Dimensi & ruang">
          <div className="grid grid-cols-3 gap-4">
            <Num label="L. Tanah m²" k="landSize" form={form} set={set} />
            <Num label="L. Bangunan m²" k="buildingSize" form={form} set={set} />
            <Num label="Lantai" k="floors" form={form} set={set} />
            <Num label="K. Tidur" k="bedrooms" form={form} set={set} />
            <Num label="K. Mandi" k="bathrooms" form={form} set={set} />
            <Num label="Carport" k="carports" form={form} set={set} />
            <Num label="K. Pembantu" k="maidRooms" form={form} set={set} />
            <Num label="Garasi" k="garage" form={form} set={set} />
            <Field label="Row jalan">
              <select value={form.roadWidth} onChange={(e) => set("roadWidth", e.target.value)} className="field">
                <option value="">Pilih</option>
                <option value="1">1 mobil</option><option value="2">2 mobil</option><option value="3">3+ mobil</option>
              </select>
            </Field>
          </div>
        </FormCard>

        {/* FASILITAS */}
        <FormCard icon={IconStar} title="Fasilitas" hint="Centang yang ada — ikut dianalisis AI & tampil di halaman, PPT, brosur">
          <div className="grid grid-cols-2 gap-2.5">
            {FACILITY_OPTIONS.map((f) => (
              <label key={f} className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-base font-bold transition ${form.facilities.includes(f) ? "border-pine-700 bg-pine-50 text-ink" : "border-ink/10 text-ink-soft hover:border-ink/30"}`}>
                <input
                  type="checkbox"
                  checked={form.facilities.includes(f)}
                  onChange={(e) => set("facilities", e.target.checked ? [...form.facilities, f] : form.facilities.filter((x) => x !== f))}
                  className="h-4 w-4 accent-pine-700"
                />
                {f}
              </label>
            ))}
          </div>
        </FormCard>

        {/* DETAIL & KONDISI */}
        <FormCard icon={IconDoc} title="Detail, kondisi & legalitas">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tahun bangun/renovasi">
              <input value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} className="field" placeholder="2021" />
            </Field>
            <Field label="Listrik (VA)">
              <input value={form.electricity} onChange={(e) => set("electricity", e.target.value)} className="field" placeholder="3500" />
            </Field>
            <Field label="IPL / bulan (Rp)">
              <input inputMode="numeric" value={form.ipl ? Number(form.ipl).toLocaleString("id-ID") : ""} onChange={(e) => set("ipl", e.target.value.replace(/\D/g, ""))} className="field" placeholder="350.000" />
            </Field>
            <Field label="Air">
              <select value={form.water} onChange={(e) => set("water", e.target.value)} className="field">
                <option value="">Pilih</option>
                <option>PAM</option><option>Sumur bor</option><option>PAM + Sumur</option>
              </select>
            </Field>
            <Field label="Hadap">
              <select value={form.facing} onChange={(e) => set("facing", e.target.value)} className="field">
                <option value="">Pilih</option>
                <option>Utara</option><option>Timur</option><option>Selatan</option><option>Barat</option>
              </select>
            </Field>
            <Field label="Furnitur">
              <select value={form.furnished} onChange={(e) => set("furnished", e.target.value)} className="field">
                <option value="">Pilih</option>
                <option>Unfurnished</option><option>Semi furnished</option><option>Full furnished</option>
              </select>
            </Field>
            <Field label="Kondisi">
              <select value={form.condition} onChange={(e) => set("condition", e.target.value)} className="field">
                <option value="">Pilih</option>
                <option>Baru</option><option>Terawat</option><option>Baru renovasi</option><option>Butuh renovasi</option>
              </select>
            </Field>
            <Field label="Sertifikat">
              <select value={form.certificate} onChange={(e) => set("certificate", e.target.value)} className="field">
                <option>SHM</option><option>HGB</option><option>Strata</option><option>AJB</option><option>Girik</option>
              </select>
            </Field>
            <label className="flex items-end gap-3 pb-3 text-lg font-bold text-ink">
              <input type="checkbox" checked={form.imb} onChange={(e) => set("imb", e.target.checked)} className="h-5 w-5 accent-pine-700" />
              IMB / PBG ada
            </label>
          </div>
          <Field label="Catatan penjual (keunggulan yang tak terlihat di foto)">
            <textarea value={form.extra} onChange={(e) => set("extra", e.target.value)} className="field min-h-[80px]" placeholder="bebas banjir, one gate, baru ganti atap, dekat sekolah X…" />
          </Field>
        </FormCard>

        <button onClick={run} disabled={running} className="btn-primary w-full py-4 text-lg disabled:opacity-60">
          <IconWand size={22} /> {running ? "AI sedang bekerja…" : "Jalankan workflow AI"}
        </button>
        {error && <p className="text-base font-bold text-red-700">{error}</p>}
      </div>

      {/* ===== PIPELINE ===== */}
      <div className="space-y-4">
        {STAGES.map((st, i) => (
          <StageCard key={st.key} index={i + 1} stage={st} state={status[st.key]}>
            {st.key === "content" && listing?.title && <ContentPreview listing={listing} />}
            {st.key === "images" && listing?.images && <ImagesPreview images={listing.images} coverSvg={coverSvg} />}
            {st.key === "marketing" && marketing && <MarketingPreview m={marketing} />}
            {st.key === "publish" && result && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={result.url} target="_blank" className="btn-primary py-2.5"><IconExternal size={18} /> Lihat halaman</Link>
                <button onClick={downloadPpt} className="btn-outline py-2.5"><IconSlide size={18} /> Unduh PPT</button>
                <Link href={`/brosur/${result.slug}`} target="_blank" className="btn-outline py-2.5"><IconPrint size={18} /> Brosur PDF</Link>
                <Link href={`/admin/video?slug=${result.slug}`} className="btn-outline py-2.5"><IconStar size={18} /> Video Sosmed</Link>
              </div>
            )}
          </StageCard>
        ))}
      </div>
    </div>
  );
}

/* ---------- potongan UI ---------- */

function FormCard({ icon: Icon, title, hint, children }) {
  return (
    <div className="card space-y-4 p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pine-50 text-pine-700"><Icon size={24} /></span>
        <div>
          <h2 className="text-xl font-extrabold text-ink">{title}</h2>
          {hint && <p className="text-base font-semibold text-ink-faint">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function Num({ label, k, form, set }) {
  return (
    <Field label={label}>
      <input inputMode="numeric" value={form[k]} onChange={(e) => set(k, e.target.value.replace(/\D/g, ""))} className="field" placeholder="0" />
    </Field>
  );
}

function StageCard({ index, stage, state, children }) {
  const tone =
    state === "done" ? "border-pine-300 bg-pine-50/40"
    : state === "running" ? "border-sand-300 bg-sand-50"
    : state === "error" ? "border-red-300 bg-red-50"
    : "border-ink/10 bg-white";
  return (
    <div className={`rounded-3xl border-2 p-6 shadow-card transition ${tone}`}>
      <div className="flex items-center gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-extrabold ${
          state === "done" ? "bg-pine-700 text-paper" : state === "running" ? "animate-pulse bg-sand-400 text-ink" : state === "error" ? "bg-red-600 text-white" : "bg-ink/10 text-ink-soft"
        }`}>
          {state === "done" ? <IconCheck size={20} /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-extrabold text-ink">{stage.label}</div>
          <div className="text-base font-semibold text-ink-faint">{stage.desc}</div>
        </div>
        <span className="text-base font-extrabold text-ink-faint">
          {state === "running" ? "Memproses…" : state === "done" ? "Selesai" : state === "error" ? "Gagal" : ""}
        </span>
      </div>
      {children}
    </div>
  );
}

function ContentPreview({ listing }) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-white/80 p-5">
      <div className="text-xl font-extrabold text-ink">{listing.title}</div>
      <p className="line-clamp-3 text-base text-ink-soft">{listing.description}</p>
      {listing.sellingPoints?.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {listing.sellingPoints.slice(0, 4).map((sp) => (
            <div key={sp.aspect} className="rounded-xl bg-pine-50 p-3">
              <div className="text-sm font-extrabold text-pine-700">{sp.aspect}</div>
              <div className="text-base font-bold text-ink">{sp.point}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImagesPreview({ images, coverSvg }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2.5">
      {images.slice(0, 7).map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt="" className="aspect-square rounded-xl object-cover" />
      ))}
      {coverSvg && (
        <div className="aspect-square overflow-hidden rounded-xl border border-ink/10" dangerouslySetInnerHTML={{ __html: coverSvg.replace('width="1200" height="1200"', 'width="100%" height="100%"') }} />
      )}
    </div>
  );
}

function MarketingPreview({ m }) {
  return (
    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
      <Snippet label="Instagram" text={m.instagram} />
      <Snippet label="WhatsApp" text={m.whatsapp} />
      <Snippet label="Iklan" text={`${m.ad?.headline} — ${m.ad?.primary}`} />
      <Snippet label="Email" text={m.email?.subject} />
    </div>
  );
}

function Snippet({ label, text }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4">
      <div className="text-sm font-extrabold text-pine-700">{label}</div>
      <p className="mt-1 line-clamp-3 text-base text-ink-soft">{text}</p>
    </div>
  );
}

// Ilustrasi solid: rumah + pin lokasi yang mengambang halus.
function HouseIllustration() {
  return (
    <svg width="132" height="96" viewBox="0 0 132 96" fill="none" aria-hidden="true">
      <style>{`
        @keyframes pinBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .h-pin { animation: pinBob 2.4s ease-in-out infinite; transform-origin: 98px 30px; }
      `}</style>
      {/* tanah */}
      <ellipse cx="62" cy="88" rx="46" ry="5" fill="#DBE8DF" />
      {/* badan rumah */}
      <path d="M24 48h76v38a3 3 0 0 1-3 3H27a3 3 0 0 1-3-3V48Z" fill="#214735" />
      {/* atap */}
      <path d="M16 50 62 16l46 34a3 3 0 0 1-3.6 4.7L62 27.5 19.6 54.7A3 3 0 0 1 16 50Z" fill="#152D22" />
      {/* pintu */}
      <rect x="52" y="60" width="20" height="29" rx="3" fill="#F7F4EE" />
      <rect x="57" y="65" width="10" height="24" rx="2" fill="#3D7256" />
      {/* jendela */}
      <rect x="32" y="58" width="13" height="13" rx="2.5" fill="#8FB59D" />
      <rect x="79" y="58" width="13" height="13" rx="2.5" fill="#8FB59D" />
      {/* pin lokasi */}
      <g className="h-pin">
        <path d="M98 8c-8.3 0-15 6.6-15 14.8C83 34 98 46 98 46s15-12 15-23.2C113 14.6 106.3 8 98 8Z" fill="#B08A4F" />
        <circle cx="98" cy="22.6" r="5.6" fill="#F7F4EE" />
      </g>
    </svg>
  );
}
