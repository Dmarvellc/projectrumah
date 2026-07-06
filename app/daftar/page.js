import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Daftar", robots: { index: false } };

export default function DaftarPage() {
  return (
    <div className="flex min-h-[70vh] items-center px-5 py-16">
      <Suspense>
        <AuthForm mode="daftar" />
      </Suspense>
    </div>
  );
}
