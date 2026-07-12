import { NextResponse } from "next/server";
import { getBrand, updateBrand, refreshDb } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ brand: getBrand() });
}

// POST { brand } — simpan profil merek/agen.
export async function POST(req) {
  try {
    await refreshDb();
    const { brand = {} } = await req.json();
    const clean = {
      brandName: String(brand.brandName || "").trim() || "RumahPlus",
      tagline: String(brand.tagline || "").trim(),
      agentName: String(brand.agentName || "").trim(),
      agentCompany: String(brand.agentCompany || "").trim(),
      agentPhone: String(brand.agentPhone || "").trim(),
      agentEmail: String(brand.agentEmail || "").trim(),
    };
    return NextResponse.json({ ok: true, brand: updateBrand(clean) });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
