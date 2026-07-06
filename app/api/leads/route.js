import { NextResponse } from "next/server";
import { addLead } from "@/lib/store";

export const runtime = "nodejs";

// Publik: menerima inquiry/lead dari halaman properti.
export async function POST(req) {
  try {
    const { name, phone, message, propertySlug, propertyTitle } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan nomor telepon wajib diisi" }, { status: 400 });
    }
    addLead({
      name: String(name).slice(0, 120),
      phone: String(phone).slice(0, 40),
      message: String(message || "").slice(0, 1000),
      propertySlug: propertySlug || null,
      propertyTitle: propertyTitle || null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
