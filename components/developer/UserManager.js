"use client";

import { useEffect, useState } from "react";
import { IconTrash } from "@/components/icons";

const ROLE_LABELS = { agent: "Agent", marketing: "Marketing", developer: "Developer" };

export default function UserManager() {
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState(["agent", "marketing", "developer"]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dev/users")
      .then((r) => r.json())
      .then((j) => {
        setUsers(j.users || []);
        if (j.roles) setRoles(j.roles);
      })
      .catch((e) => setError(String(e)));
  }, []);

  async function changeRole(uid, role) {
    setError("");
    const res = await fetch("/api/dev/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, role }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Gagal");
    setUsers((u) => u.map((x) => (x.uid === uid ? { ...x, role } : x)));
  }

  async function remove(uid) {
    if (!confirm("Hapus akses pengguna ini?")) return;
    await fetch("/api/dev/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    setUsers((u) => u.filter((x) => x.uid !== uid));
  }

  if (users === null) return <p className="text-lg font-semibold text-ink-faint">Memuat…</p>;

  if (!users.length)
    return (
      <div className="card p-10 text-center">
        <p className="text-xl font-extrabold text-ink">Belum ada pengguna terdaftar</p>
        <p className="mt-2 text-lg text-ink-soft">
          Pengguna muncul di sini setelah masuk lewat halaman <span className="font-bold">/daftar</span> atau Google.
          Pemilik (OWNER_EMAIL) otomatis menjadi Developer.
        </p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-ink/10 text-base font-extrabold text-ink">
            <th className="px-6 py-4">Pengguna</th>
            <th className="px-6 py-4">Peran</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {users.map((u) => (
            <tr key={u.uid}>
              <td className="px-6 py-4">
                <div className="text-lg font-bold text-ink">{u.name || "—"}</div>
                <div className="text-base font-semibold text-ink-faint">{u.email}</div>
              </td>
              <td className="px-6 py-4">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.uid, e.target.value)}
                  className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base font-bold text-ink outline-none focus:border-pine-500"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => remove(u.uid)} className="text-ink-faint transition hover:text-red-700">
                  <IconTrash size={22} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="px-6 pb-4 text-base font-bold text-red-700">{error}</p>}
    </div>
  );
}
