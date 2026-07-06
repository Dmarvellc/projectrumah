import Link from "next/link";
import { SITE } from "@/data";
import { IconShield, IconCheck, IconStar, IconPhone, IconChat, IconPin } from "@/components/icons";

export const metadata = {
  title: "Tentang Kami",
  description:
    "RumahPlus adalah penyedia properti terkurasi di Indonesia. Kami memeriksa legalitas, memvalidasi kondisi, dan mendampingi setiap transaksi hingga tuntas.",
  alternates: { canonical: "/tentang" },
};

export default function TentangPage() {
  return (
    <div className="pb-8">
      <section className="bg-pine-800 text-paper">
        <div className="container-x py-20">
          <div className="max-w-2xl">
            <span className="eyebrow text-sand-300">Tentang RumahPlus</span>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Properti pilihan, dikurasi dengan integritas.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-paper/85">
              {SITE.description}
            </p>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <Value icon={IconShield} title="Legalitas lebih dulu" text="Setiap properti diperiksa keabsahan sertifikat dan dokumennya sebelum kami tayangkan." />
          <Value icon={IconCheck} title="Transparan apa adanya" text="Kami menampilkan kondisi dan spesifikasi secara jujur, agar keputusan Anda tepat." />
          <Value icon={IconStar} title="Pendampingan tuntas" text="Dari survei, negosiasi, hingga serah terima — tim kami mendampingi Anda di setiap langkah." />
        </div>
      </section>

      <section className="container-x">
        <div className="grid gap-10 rounded-3xl border border-ink/10 bg-white p-8 shadow-card md:grid-cols-2 md:p-12">
          <div>
            <span className="eyebrow">Cerita kami</span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
              Membeli properti seharusnya tenang, bukan menegangkan.
            </h2>
            <div className="mt-5 space-y-4 text-ink-soft leading-relaxed">
              <p>
                RumahPlus lahir dari pengalaman sederhana: terlalu banyak listing
                properti yang membingungkan, tidak akurat, dan sulit dipercaya.
              </p>
              <p>
                Kami memilih jalan berbeda — mengurasi sendiri setiap properti,
                memverifikasi datanya, dan hanya menayangkan yang benar-benar layak.
                Lebih sedikit, tetapi terpercaya.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-pine-50 p-8">
            <h3 className="font-serif text-xl font-semibold text-ink">Hubungi kami</h3>
            <ul className="mt-5 space-y-4 text-ink-soft">
              <li className="flex items-center gap-3"><IconPhone size={18} className="text-pine-600" /> {SITE.phone}</li>
              <li className="flex items-center gap-3"><IconChat size={18} className="text-pine-600" /> {SITE.email}</li>
              <li className="flex items-start gap-3"><IconPin size={18} className="mt-0.5 text-pine-600" /> {SITE.address}</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${SITE.phoneRaw}`} className="btn-primary">Telepon kami</a>
              <Link href="/properti" className="btn-outline">Lihat properti</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Value({ icon: Icon, title, text }) {
  return (
    <div>
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-pine-50 text-pine-700">
        <Icon size={24} />
      </span>
      <h3 className="mt-4 font-serif text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}
