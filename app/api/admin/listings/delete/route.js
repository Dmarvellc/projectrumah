import { NextResponse } from "next/server";
import { deleteListing, refreshDb } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req) {
  await refreshDb();
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });
  deleteListing(slug);
  return NextResponse.json({ ok: true });
}
