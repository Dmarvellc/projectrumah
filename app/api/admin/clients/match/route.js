import { NextResponse } from "next/server";
import { listClients, allListings } from "@/lib/store";

export const runtime = "nodejs";

// POST { id } — cocokkan preferensi klien dengan listing terbit.
// Skor: status jual/sewa, tipe, budget, dan kecocokan lokasi.
export async function POST(req) {
  try {
    const { id } = await req.json();
    const client = listClients().find((c) => c.id === id);
    if (!client) return NextResponse.json({ error: "Klien tidak ditemukan" }, { status: 404 });

    const locWords = String(client.prefLocation || "")
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((w) => w.length > 2);

    const scored = allListings({ publishedOnly: true })
      .map((l) => {
        let score = 0;
        const why = [];
        if (l.listing === client.need) { score += 2; }
        else return null; // jual vs sewa tidak bisa ditawar
        if (l.type === client.prefType) { score += 3; why.push("tipe sesuai"); }
        if (client.budget > 0 && l.price > 0) {
          if (l.price <= client.budget) { score += 4; why.push("dalam budget"); }
          else if (l.price <= client.budget * 1.15) { score += 2; why.push("sedikit di atas budget"); }
          else score -= 2;
        }
        const hay = `${l.location} ${l.city}`.toLowerCase();
        if (locWords.some((w) => hay.includes(w))) { score += 4; why.push("lokasi cocok"); }
        return { slug: l.slug, title: l.title, location: l.location, price: l.price, listing: l.listing, priceUnit: l.priceUnit, type: l.type, image: l.images?.[0], score, why };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ ok: true, matches: scored });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
