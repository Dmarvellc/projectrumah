import BrandSettings from "@/components/admin/BrandSettings";
import { getBrand } from "@/lib/store";

export const metadata = { title: "Brand & Profil" };
export const dynamic = "force-dynamic";

export default function BrandPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Brand & Profil</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Nama, nomor telepon, dan watermark Anda sendiri — otomatis dipakai di halaman properti, PPT, brosur, dan video.
        </p>
      </header>
      <BrandSettings initial={getBrand()} />
    </div>
  );
}
