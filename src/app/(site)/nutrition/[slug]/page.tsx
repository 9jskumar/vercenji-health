import { Suspense } from "react";
import { ProductDetail } from "@/components/catalogue/ProductDetail";

export default function NutritionProduct({ params }: PageProps<"/nutrition/[slug]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-[1240px] px-6 py-10 text-stone">Loading…</p>}>
      <ProductDetail vertical="NUTRITION" params={params} section={{ label: "Nutrition & Supplements", href: "/nutrition" }} />
    </Suspense>
  );
}
