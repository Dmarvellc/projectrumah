import { NextResponse } from "next/server";
import { allListings, getListing } from "@/lib/store";
import { findComparables, generateCMA } from "@/lib/cma";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST { slug } atau { subject:{type,listing,cluster,location,city,landSize,buildingSize,bedrooms,price} }
export async function POST(req) {
  try {
    const body = await req.json();
    const subject = body.slug ? getListing(body.slug) : body.subject;
    if (!subject || !subject.type) {
      return NextResponse.json({ error: "Subjek properti tidak lengkap" }, { status: 400 });
    }
    const pool = allListings({ publishedOnly: true });
    const comps = findComparables(subject, pool);
    const result = await generateCMA(subject, comps);
    return NextResponse.json({ ok: true, subject: { title: subject.title, type: subject.type, listing: subject.listing }, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
