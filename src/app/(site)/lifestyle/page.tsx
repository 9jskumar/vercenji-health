import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogueListing } from "@/components/catalogue/CatalogueListing";
import { lifestyleAudiences } from "@/content/catalogue";

export const metadata: Metadata = {
  title: "Lifestyle, Wearables & Accessories",
  description: "Activewear, wearables, bottles and fitness accessories from Vercenji. Wear your wellness, live your lifestyle.",
  alternates: { canonical: "/lifestyle" },
};

export default function LifestylePage({ searchParams }: PageProps<"/lifestyle">) {
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-stone"><Link href="/" className="text-green">Home</Link> / Lifestyle</nav>
          <h1 className="m-0 font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] font-normal text-forest">Wear your wellness. Live your lifestyle.</h1>
          <p className="m-0 max-w-[640px] text-lg leading-relaxed text-[#45453F]">
            Activewear, wearables, hydration and fitness accessories for active, healthy days, with sizes, colours and warranty details on every product.
          </p>
        </div>
      </section>
      <Suspense fallback={<p className="mx-auto max-w-[1240px] px-6 py-10 text-stone">Loading products…</p>}>
        <CatalogueListing vertical="LIFESTYLE" audiences={lifestyleAudiences} basePath="/lifestyle" searchParams={searchParams} emptyMessage="The lifestyle collection is being prepared for launch. Join the newsletter on the home page to hear when they arrive." />
      </Suspense>
    </>
  );
}
