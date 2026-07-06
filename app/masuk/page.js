import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Masuk", robots: { index: false } };

export default function MasukPage() {
  return (
    <div className="flex min-h-[70vh] items-center px-5 py-16">
      <Suspense>
        <AuthForm mode="masuk" />
      </Suspense>
    </div>
  );
}
