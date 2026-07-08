import { NextResponse } from "next/server";
import { restoreSeeds } from "@/lib/store";

export const runtime = "nodejs";

// Munculkan kembali semua listing katalog bawaan yang disembunyikan.
export async function POST() {
  restoreSeeds();
  return NextResponse.json({ ok: true });
}
