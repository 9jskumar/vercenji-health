import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export async function FeaturedProducts() {
  await connection();
  const products = await db.product.findMany({
    where: { status: "ACTIVE", vertical: "NUTRITION" },
    orderBy: { updatedAt: "desc" },
    take: 4,
    include: {
      variants: { where: { isActive: true }, orderBy: { priceMinor: "asc" }, take: 1 },
      categories: { include: { category: true }, take: 1 },
    },
  });
  const items = products.filter((p) => p.variants.length > 0);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto flex max-w-[1240px] flex-col gap-7 px-6 pt-14 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">Featured</div>
          <h2 className="h2">Featured products</h2>
        </div>
        <Link href="/nutrition" className="font-bold text-green underline underline-offset-4">Shop all supplements</Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => {
          const v = p.variants[0];
          return (
            <Link key={p.id} href={`/nutrition/${p.slug}`} className="card-lift flex flex-col gap-3 rounded-3xl border border-line bg-white p-5 no-underline">
              <span className="text-xs font-semibold tracking-[0.08em] text-stone uppercase">{p.categories[0]?.category.name}</span>
              <h3 className="m-0 font-serif text-2xl font-normal text-forest">{p.name}</h3>
              {p.subtitle && <p className="m-0 text-[15px] text-stone">{p.subtitle}</p>}
              <span className="mt-auto text-lg font-bold text-charcoal">{formatMoney(v.priceMinor, v.currency)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
