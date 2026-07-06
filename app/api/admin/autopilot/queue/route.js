import { NextResponse } from "next/server";
import { getAutopilotSettings, addToQueue, removeFromQueue, runQueueNext } from "@/lib/autopilot";

export const runtime = "nodejs";
export const maxDuration = 300;

// GET: lihat antrean otomasi
export async function GET() {
  return NextResponse.json(getAutopilotSettings());
}

// POST: { spec } tambah ke antrean · { action: "run-next" } proses item terdepan
export async function POST(req) {
  try {
    const body = await req.json();
    if (body.action === "run-next") {
      const result = await runQueueNext();
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
    if (!String(body.spec || "").trim()) {
      return NextResponse.json({ error: "Spesifikasi kosong" }, { status: 400 });
    }
    const item = addToQueue(body.spec);
    return NextResponse.json({ ok: true, item, queue: getAutopilotSettings().queue });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// DELETE: { id } hapus dari antrean
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    removeFromQueue(id);
    return NextResponse.json({ ok: true, queue: getAutopilotSettings().queue });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
