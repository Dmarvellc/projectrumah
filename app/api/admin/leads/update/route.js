import { NextResponse } from "next/server";
import { updateLead } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req) {
  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const lead = updateLead(id, { status });
  return NextResponse.json({ ok: true, lead });
}
