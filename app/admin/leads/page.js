import { listLeads } from "@/lib/store";
import LeadCard from "@/components/admin/LeadCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

export default function LeadsPage() {
  const leads = listLeads();
  const hot = leads.filter((l) => l.ai?.temperature === "hot").length;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Leads</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Inquiry dari halaman properti. Analisis AI menilai keseriusan & menyusun follow-up siap kirim.
        </p>
      </header>

      {leads.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Stat label="Total leads" value={leads.length} />
          <Stat label="Baru" value={leads.filter((l) => l.status === "new").length} />
          <Stat label="Panas" value={hot} tone={hot > 0} />
        </div>
      )}

      {leads.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-xl font-extrabold text-ink">Belum ada leads</p>
          <p className="mt-2 text-lg text-ink-soft">Form kontak di setiap halaman properti mengirim inquiry ke sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((l) => (
            <LeadCard key={l.id} lead={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-card ${tone ? "border-red-300 bg-red-50" : "border-ink/10 bg-white"}`}>
      <div className={`text-4xl font-extrabold ${tone ? "text-red-600" : "text-ink"}`}>{value}</div>
      <div className="mt-1 text-lg font-bold text-ink-soft">{label}</div>
    </div>
  );
}
