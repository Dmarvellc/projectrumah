import { NextResponse } from "next/server";
import { deleteArticle } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req) {
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });
  deleteArticle(slug);
  return NextResponse.json({ ok: true });
}
