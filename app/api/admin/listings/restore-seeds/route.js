import { NextResponse } from "next/server";
import { restoreSeeds, refreshDb } from "@/lib/store";

export const runtime = "nodejs";

// Munculkan kembali semua listing katalog bawaan yang disembunyikan.
export async function POST() {
  await refreshDb();
  restoreSeeds();
  return NextResponse.json({ ok: true });
}
