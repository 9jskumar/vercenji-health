import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function Categories() {
  await requireStaff(PERMISSIONS.catalogueManage);
  const cats = await db.category.findMany({ orderBy: [{ vertical: "asc" }, { sortOrder: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/products" className="text-sm font-semibold text-green underline">← Products</Link>
      <h1 className="m-0 font-serif text-4xl font-normal text-forest">Categories</h1>
      <CategoryForm />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {cats.map((c) => (
          <li key={c.id} className="flex justify-between rounded-xl bg-white p-3 ring-1 ring-line">
            <span><strong>{c.name}</strong> <span className="text-sm text-stone">/{c.slug} · {c.vertical.toLowerCase()}</span></span>
            <span className="text-sm text-stone">{c._count.products} products</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
