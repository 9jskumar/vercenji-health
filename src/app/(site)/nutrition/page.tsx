import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogueListing } from "@/components/catalogue/CatalogueListing";

export const metadata: Metadata = {
  title: "Nutrition & Supplements",
  description: "Ayurvedic-inspired herbal formulations and everyday nutrition from Vercenji, with ingredients, pack sizes and directions shown in full.",
  alternates: { canonical: "/nutrition" },
};

export default function NutritionPage({ searchParams }: PageProps<"/nutrition">) {
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-stone"><Link href="/" className="text-green">Home</Link> / Nutrition &amp; Supplements</nav>
          <h1 className="m-0 font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] font-normal text-forest">Nutrition &amp; Supplements</h1>
          <p className="m-0 max-w-[640px] text-lg leading-relaxed text-[#45453F]">
            Ayurvedic-inspired herbal formulations and everyday nutrition, with ingredients, pack sizes and directions shown in full on every product.
          </p>
        </div>
      </section>
      <Suspense fallback={<p className="mx-auto max-w-[1240px] px-6 py-10 text-stone">Loading products…</p>}>
        <CatalogueListing vertical="NUTRITION" basePath="/nutrition" searchParams={searchParams} emptyMessage="Our first products are being prepared for launch. Join the newsletter on the home page to hear when they arrive." />
      </Suspense>
    </>
  );
}
