"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TYPE_LABELS } from "@/data";
import { formatPrice } from "@/lib/utils";
import { IconCheck } from "@/components/icons";

const FACILITY_OPTIONS = [
  "Kolam Renang", "Taman", "Gudang", "Kitchen Set", "Water Heater",
  "AC", "CCTV", "Smart Home", "One Gate System", "Solar Panel",
];
const fmtID = (d) => (d ? Number(d).toLocaleString("id-ID") : "");
const digits = (s) => String(s ?? "").replace(/\D/g, "");

export default function ListingEditor({ listing }) {
  const router = useRouter();
  const [f, setF] = useState({
    title: listing.title || "",
    listing: listing.listing || "jual",
    type: listing.type || "rumah",
    status: listing.status || "published",
    featured: Boolean(listing.featured),
    price: String(listing.price || ""),
    location: listing.location || "",
    cluster: listing.cluster || "",
    bedrooms: String(listing.bedrooms || ""),
    bathrooms: String(listing.bathrooms || ""),
    carports: String(listing.carports || ""),
    maidRooms: String(listing.maidRooms || ""),
    garage: String(listing.garage || ""),
    landSize: String(listing.landSize || ""),
    buildingSize: String(listing.buildingSize || ""),
    floors: String(listing.floors || ""),
    ipl: String(listing.ipl || ""),
    electricity: listing.electricity || "",
    facing: listing.facing || "",
    furnished: listing.furnished || "",
    condition: listing.condition || "",
    certificate: listing.certificate || "SHM",
    imb: Boolean(listing.imb),
    facilities: Array.isArray(listing.facilities) ? listing.facilities : [],
    description: listing.description || "",
    agentName: listing.agent?.name || "",
    agentPhone: listing.agent?.phone || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function save() {
    setBusy(true);
    setError("");
    try {
      const patch = {
        ...f,
        price: Number(digits(f.price)) || 0,
        ipl: Number(digits(f.ipl)) || 0,
        agent: { ...(listing.agent || {}), name: f.agentName, phone: f.agentPhone },
      };
      delete patch.agentName;
      delete patch.agentPhone;
      const res = await fetch("/api/admin/listings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: listing.slug, patch }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Gagal menyimpan");
      router.push("/admin/listings");
      router.refresh();
    } catch (err) {
      setError(String(err.message || err));
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* DASAR */}
      <Card title="Informasi utama">
        <Field label="Judul">
          <input value={f.title} onChange={(e) => set("title", e.target.value)} className="field" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tipe">
            <select value={f.type} onChange={(e) => set("type", e.target.value)} className="field">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Status jual/sewa">
            <select value={f.listing} onChange={(e) => set("listing", e.target.value)} className="field">
              <option value="jual">Dijual</option>
              <option value="sewa">Disewakan</option>
            </select>
          </Field>
          <Field label="Tayang">
            <select value={f.status} onChange={(e) => set("status", e.target.value)} className="field">
              <option value="published">Terbit</option>
              <option value="draft">Draf (disembunyikan)</option>
            </select>
          </Field>
        </div>
        <Field label="Harga (Rp)">
          <div className="relative">
            <input inputMode="numeric" value={fmtID(digits(f.price))} onChange={(e) => set("price", digits(e.target.value))} className="field pr-32" />
            {digits(f.price) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-pine-700 px-3 py-1.5 text-base font-extrabold text-paper">
                {formatPrice(Number(digits(f.price)), f.listing)}
              </span>
            )}
          </div>
        </Field>
        <label className="flex items-center gap-3 text-lg font-bold text-ink">
          <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-5 w-5 accent-pine-700" />
          Tampilkan sebagai unggulan di beranda
        </label>
      </Card>

      {/* LOKASI */}
      <Card title="Lokasi">
        <Field label="Kawasan / Kota"><input value={f.location} onChange={(e) => set("location", e.target.value)} className="field" /></Field>
        <Field label="Cluster / Perumahan"><input value={f.cluster} onChange={(e) => set("cluster", e.target.value)} className="field" /></Field>
      </Card>

      {/* SPESIFIKASI */}
      <Card title="Spesifikasi">
        <div className="grid grid-cols-3 gap-4">
          <Num label="K. Tidur" k="bedrooms" f={f} set={set} />
          <Num label="K. Mandi" k="bathrooms" f={f} set={set} />
          <Num label="Carport" k="carports" f={f} set={set} />
          <Num label="K. Pembantu" k="maidRooms" f={f} set={set} />
          <Num label="Garasi" k="garage" f={f} set={set} />
          <Num label="Lantai" k="floors" f={f} set={set} />
          <Num label="L. Tanah m²" k="landSize" f={f} set={set} />
          <Num label="L. Bangunan m²" k="buildingSize" f={f} set={set} />
          <Field label="IPL/bln (Rp)"><input inputMode="numeric" value={fmtID(digits(f.ipl))} onChange={(e) => set("ipl", digits(e.target.value))} className="field" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Listrik (VA)"><input value={f.electricity} onChange={(e) => set("electricity", e.target.value)} className="field" /></Field>
          <Field label="Sertifikat">
            <select value={f.certificate} onChange={(e) => set("certificate", e.target.value)} className="field">
              <option>SHM</option><option>HGB</option><option>Strata</option><option>AJB</option><option>Girik</option>
            </select>
          </Field>
          <Field label="Hadap">
            <select value={f.facing} onChange={(e) => set("facing", e.target.value)} className="field">
              <option value="">—</option><option>Utara</option><option>Timur</option><option>Selatan</option><option>Barat</option>
            </select>
          </Field>
          <Field label="Furnitur">
            <select value={f.furnished} onChange={(e) => set("furnished", e.target.value)} className="field">
              <option value="">—</option><option>Unfurnished</option><option>Semi furnished</option><option>Full furnished</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* FASILITAS */}
      <Card title="Fasilitas">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {FACILITY_OPTIONS.map((x) => (
            <label key={x} className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-base font-bold transition ${f.facilities.includes(x) ? "border-pine-700 bg-pine-50 text-ink" : "border-ink/10 text-ink-soft hover:border-ink/30"}`}>
              <input type="checkbox" checked={f.facilities.includes(x)} onChange={(e) => set("facilities", e.target.checked ? [...f.facilities, x] : f.facilities.filter((y) => y !== x))} className="h-4 w-4 accent-pine-700" />
              {x}
            </label>
          ))}
        </div>
      </Card>

      {/* DESKRIPSI + KONTAK */}
      <Card title="Deskripsi & kontak">
        <Field label="Deskripsi"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="field min-h-[160px]" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama agen (kartu kontak)"><input value={f.agentName} onChange={(e) => set("agentName", e.target.value)} className="field" /></Field>
          <Field label="Telepon agen"><input value={f.agentPhone} onChange={(e) => set("agentPhone", e.target.value)} className="field" /></Field>
        </div>
      </Card>

      {error && <p className="text-lg font-bold text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button onClick={save} disabled={busy} className="btn-primary flex-1 py-4 text-lg disabled:opacity-60">
          <IconCheck size={22} /> {busy ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        <button onClick={() => router.back()} disabled={busy} className="btn-outline py-4 text-lg">Batal</button>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card space-y-4 p-7">
      <h2 className="text-xl font-extrabold text-ink">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (<div><span className="label">{label}</span>{children}</div>);
}
function Num({ label, k, f, set }) {
  return (<Field label={label}><input inputMode="numeric" value={f[k]} onChange={(e) => set(k, e.target.value.replace(/\D/g, ""))} className="field" placeholder="0" /></Field>);
}
