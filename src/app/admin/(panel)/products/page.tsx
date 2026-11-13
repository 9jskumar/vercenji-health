import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/money";
import { ProductStatus, Vertical } from "@/generated/prisma/enums";

const statusText: Record<ProductStatus, [string, string]> = {
  DRAFT: ["Draft", "bg-[#EEEEEC] text-stone"],
  PENDING_REVIEW: ["Waiting for review", "bg-[#FBF1DC] text-[#7A5A1E]"],
  ACTIVE: ["Active", "bg-[#DCE6DC] text-forest"],
  ARCHIVED: ["Archived", "bg-[#EEEEEC] text-stone"],
};
const verticalText: Record<string, string> = { NUTRITION: "Nutrition", LIFESTYLE: "Lifestyle", EMS: "EMS equipment", WATER: "Water", FOOD: "Food" };

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/products">) {
  await requireStaff(PERMISSIONS.catalogueManage);
  const sp = await searchParams;
  const vertical = Object.values(Vertical).find((v) => v === sp.vertical);
  const status = Object.values(ProductStatus).find((s) => s === sp.status);
  const products = await db.product.findMany({
    where: { ...(vertical && { vertical }), ...(status && { status }) },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { variants: { select: { priceMinor: true, stock: true, lowStockAt: true, isActive: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Products</h1>
        <div className="flex gap-3">
          <Link href="/admin/categories" className="btn-ghost py-2.5">Categories</Link>
          <Link href="/admin/products/new" className="btn-primary py-2.5">New product</Link>
        </div>
      </div>
      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <label className="flex flex-col gap-1 text-sm font-semibold">Vertical
          <select name="vertical" defaultValue={vertical ?? ""} className="field py-2">
            <option value="">All</option>
            {["NUTRITION", "LIFESTYLE", "EMS"].map((v) => <option key={v} value={v}>{verticalText[v]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">Status
          <select name="status" defaultValue={status ?? ""} className="field py-2">
            <option value="">All</option>
            {Object.values(ProductStatus).map((s) => <option key={s} value={s}>{statusText[s][0]}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary py-2.5">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-ivory text-xs tracking-wide text-stone uppercase">
            <tr><th className="p-3">Product</th><th className="p-3">Vertical</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const active = p.variants.filter((v) => v.isActive);
              const stock = active.reduce((s, v) => s + v.stock, 0);
              const low = active.some((v) => v.stock <= v.lowStockAt);
              const prices = active.map((v) => v.priceMinor);
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3"><Link href={`/admin/products/${p.id}`} className="font-semibold text-green underline">{p.name}</Link><span className="block text-xs text-stone">/{p.slug}</span></td>
                  <td className="p-3">{verticalText[p.vertical]}</td>
                  <td className="p-3">{prices.length ? formatMoney(Math.min(...prices)) : <span className="text-[#9B2C2C]">No options</span>}</td>
                  <td className="p-3">{stock}{low && active.length > 0 && <span className="ml-2 text-xs font-semibold text-[#9B2C2C]">Low</span>}</td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusText[p.status][1]}`}>{statusText[p.status][0]}</span></td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone">No products yet. Use New product to add the first one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
