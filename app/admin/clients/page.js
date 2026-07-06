import ClientManager from "@/components/admin/ClientManager";
import { listClients } from "@/lib/store";

export const metadata = { title: "Klien" };
export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Klien</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Pipeline penjualan Anda: prospek sampai closing, lengkap dengan pencocokan otomatis ke listing.
        </p>
      </header>
      <ClientManager initialClients={listClients()} />
    </div>
  );
}
