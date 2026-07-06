import PipelineStudio from "@/components/admin/PipelineStudio";

export const metadata = { title: "Studio Listing" };

export default function NewListingPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-ink">Studio Listing</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">
          Dari spesifikasi + foto ke halaman live, marketing, dan PPT dalam satu alur.
        </p>
      </header>
      <PipelineStudio />
    </div>
  );
}
