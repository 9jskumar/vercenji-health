import Link from "next/link";
import { connection } from "next/server";
import { listCategories, listProducts, SORTS, type SortKey } from "@/lib/catalogue";
import type { Vertical } from "@/generated/prisma/enums";
import { ProductCard } from "./ProductCard";

type Props = {
  vertical: Vertical;
  basePath: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  audiences?: readonly { id: string; label: string }[];
  emptyMessage: string;
};

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 100) : undefined);

export async function CatalogueListing({ vertical, basePath, searchParams, audiences, emptyMessage }: Props) {
  await connection();
  const sp = await searchParams;
  const category = one(sp.category);
  const q = one(sp.q)?.trim() || undefined;
  const sort = (Object.keys(SORTS) as SortKey[]).find((k) => k === sp.sort) ?? "popular";
  const audience = audiences?.find((a) => a.id === one(sp.for))?.id;
  const [categories, products] = await Promise.all([
    listCategories(vertical),
    listProducts({ vertical, category, q, sort, audience }),
  ]);
  const link = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { category, q, sort: sort === "popular" ? undefined : sort, for: audience, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v);
    const s = u.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const chip = (active: boolean) =>
    `flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm font-semibold no-underline ${active ? "bg-green text-white" : "bg-white text-charcoal ring-1 ring-line hover:ring-green"}`;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-wrap gap-8 px-6 pt-10 pb-[88px]">
      <aside aria-label="Filters" className="flex flex-[1_1_240px] flex-col gap-6 lg:max-w-[260px]">
        <form action={basePath} className="flex flex-col gap-1.5" role="search">
          <label htmlFor="q" className="label">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search products" className="field" />
          {category && <input type="hidden" name="category" value={category} />}
          {audience && <input type="hidden" name="for" value={audience} />}
        </form>
        {categories.length > 0 && (
          <nav aria-label="Categories" className="flex flex-col gap-2">
            <span className="label">Category</span>
            <Link href={link({ category: undefined })} className={chip(!category)}>All products</Link>
            {categories.map((c) => (
              <Link key={c.id} href={link({ category: c.slug })} className={chip(category === c.slug)} aria-current={category === c.slug ? "page" : undefined}>
                <span>{c.name}</span>
                <span className="opacity-70">{c._count.products}</span>
              </Link>
            ))}
          </nav>
        )}
        {audiences && (
          <nav aria-label="Shop for" className="flex flex-col gap-2">
            <span className="label">Shop for</span>
            <div className="flex flex-wrap gap-2">
              <Link href={link({ for: undefined })} className={chip(!audience)}>Everyone</Link>
              {audiences.map((a) => (
                <Link key={a.id} href={link({ for: a.id })} className={chip(audience === a.id)}>{a.label}</Link>
              ))}
            </div>
          </nav>
        )}
      </aside>

      <section className="flex flex-[3_1_600px] flex-col gap-5" aria-label="Products">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-stone"><strong className="text-charcoal">{products.length}</strong> products</span>
          <form action={basePath} className="flex items-center gap-2 text-sm">
            {category && <input type="hidden" name="category" value={category} />}
            {q && <input type="hidden" name="q" value={q} />}
            {audience && <input type="hidden" name="for" value={audience} />}
            <label htmlFor="sort" className="font-semibold">Sort by</label>
            <select id="sort" name="sort" defaultValue={sort} className="field w-auto py-2">
              {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <button type="submit" className="rounded-full bg-green px-4 py-2 font-semibold text-white">Apply</button>
          </form>
        </div>
        {products.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-stone ring-1 ring-line">
            {q || category || audience ? "No products match. Try another search or category." : emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => <ProductCard key={p.id} product={p} href={`${basePath}/${p.slug}`} />)}
          </div>
        )}
      </section>
    </div>
  );
}
