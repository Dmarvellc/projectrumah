import UserManager from "@/components/developer/UserManager";

export const metadata = { title: "Pengguna" };
export const dynamic = "force-dynamic";

export default function DeveloperUsers() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Pengguna</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Atur siapa masuk ke dashboard mana: Agent, Marketing, atau Developer. Perubahan peran berlaku saat login berikutnya.
        </p>
      </header>
      <UserManager />
    </div>
  );
}
