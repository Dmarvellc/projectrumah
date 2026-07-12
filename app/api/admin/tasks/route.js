import { NextResponse } from "next/server";
import { listTasks, addTask, updateTask, deleteTask, refreshDb } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ tasks: listTasks() });
}

// POST { task }
export async function POST(req) {
  try {
    await refreshDb();
    const { task = {} } = await req.json();
    if (!String(task.title || "").trim()) {
      return NextResponse.json({ error: "Judul tugas wajib" }, { status: 400 });
    }
    const record = addTask({
      title: task.title.trim(),
      due: task.due || null,
      kind: task.kind || "followup",
      clientId: task.clientId || null,
      leadId: task.leadId || null,
      listingSlug: task.listingSlug || null,
      notes: task.notes || "",
    });
    return NextResponse.json({ ok: true, task: record, tasks: listTasks() });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// PATCH { id, ...patch }  (mis. { id, done: true })
export async function PATCH(req) {
  try {
    await refreshDb();
    const { id, ...patch } = await req.json();
    const record = updateTask(id, patch);
    if (!record) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true, task: record, tasks: listTasks() });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// DELETE { id }
export async function DELETE(req) {
  try {
    await refreshDb();
    const { id } = await req.json();
    deleteTask(id);
    return NextResponse.json({ ok: true, tasks: listTasks() });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
