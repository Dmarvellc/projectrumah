import { NextResponse } from "next/server";
import { listClients, addClient, updateClient, deleteClient } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ clients: listClients() });
}

// POST { client } — tambah klien (bisa dari konversi lead)
export async function POST(req) {
  try {
    const { client = {} } = await req.json();
    if (!String(client.name || "").trim()) {
      return NextResponse.json({ error: "Nama klien wajib" }, { status: 400 });
    }
    const record = addClient({
      name: client.name.trim(),
      phone: client.phone || "",
      email: client.email || "",
      need: client.need === "sewa" ? "sewa" : "jual",
      prefType: client.prefType || "rumah",
      prefLocation: client.prefLocation || "",
      budget: Number(client.budget) || 0,
      stage: client.stage || "prospek",
      notes: client.notes || "",
      leadId: client.leadId || null,
    });
    return NextResponse.json({ ok: true, client: record, clients: listClients() });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// PATCH { id, ...patch } — update stage/catatan/data
export async function PATCH(req) {
  try {
    const { id, ...patch } = await req.json();
    const record = updateClient(id, patch);
    if (!record) return NextResponse.json({ error: "Klien tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true, client: record, clients: listClients() });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    deleteClient(id);
    return NextResponse.json({ ok: true, clients: listClients() });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
