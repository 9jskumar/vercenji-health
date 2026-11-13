import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { allCategories, emptyProduct } from "@/lib/admin-products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProduct() {
  await requireStaff(PERMISSIONS.catalogueManage);
  const categories = await allCategories();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/products" className="text-sm font-semibold text-green underline">← All products</Link>
      <h1 className="m-0 font-serif text-4xl font-normal text-forest">New product</h1>
      <p className="m-0 text-stone">Save the product first, then add its options (sizes, prices, stock) and images.</p>
      <ProductForm values={emptyProduct()} categories={categories} />
    </div>
  );
}
