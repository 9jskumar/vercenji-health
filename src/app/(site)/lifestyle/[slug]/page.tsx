import { Suspense } from "react";
import { ProductDetail } from "@/components/catalogue/ProductDetail";

export default function LifestyleProduct({ params }: PageProps<"/lifestyle/[slug]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-[1240px] px-6 py-10 text-stone">Loading…</p>}>
      <ProductDetail vertical="LIFESTYLE" params={params} section={{ label: "Lifestyle", href: "/lifestyle" }} />
    </Suspense>
  );
}
