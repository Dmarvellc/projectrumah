import { NextResponse } from "next/server";
import { listLeads, updateLead } from "@/lib/store";
import { analyzeLead } from "@/lib/leadai";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST { id } — nilai lead + susun follow-up, simpan ke lead.
export async function POST(req) {
  try {
    const { id } = await req.json();
    const lead = listLeads().find((l) => l.id === id);
    if (!lead) return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });
    const ai = await analyzeLead(lead);
    const saved = updateLead(id, { ai });
    return NextResponse.json({ ok: true, ai: saved.ai });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
