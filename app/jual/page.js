import { redirect } from "next/navigation";

// Listing untuk publik tidak tersedia — situs ini menampilkan properti
// yang dikurasi sendiri. Alihkan ke beranda.
export default function JualPage() {
  redirect("/");
}
