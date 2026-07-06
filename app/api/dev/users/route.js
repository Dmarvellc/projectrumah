import { NextResponse } from "next/server";
import { listUsers, updateUser, deleteUser } from "@/lib/store";
import { ROLES } from "@/lib/session";

export const runtime = "nodejs";

// GET — semua akun dashboard
export async function GET() {
  return NextResponse.json({ users: listUsers(), roles: ROLES });
}

// PATCH { uid, role } — ubah peran (berlaku saat user login berikutnya)
export async function PATCH(req) {
  try {
    const { uid, role } = await req.json();
    if (!ROLES.includes(role)) return NextResponse.json({ error: "Peran tidak dikenal" }, { status: 400 });
    const user = updateUser(uid, { role });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// DELETE { uid }
export async function DELETE(req) {
  try {
    const { uid } = await req.json();
    deleteUser(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
