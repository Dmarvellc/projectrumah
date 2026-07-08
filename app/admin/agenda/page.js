import AgendaManager from "@/components/admin/AgendaManager";
import { listTasks, listClients, allListings } from "@/lib/store";

export const metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

export default function AgendaPage() {
  const tasks = listTasks();
  const clients = listClients().map((c) => ({ id: c.id, name: c.name }));
  const listings = allListings({ publishedOnly: true }).map((l) => ({ slug: l.slug, title: l.title }));

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Agenda</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Tugas & pengingat harian: follow-up, survei, dokumen, nego. Jangan ada prospek yang terlewat.
        </p>
      </header>
      <AgendaManager initialTasks={tasks} clients={clients} listings={listings} />
    </div>
  );
}
