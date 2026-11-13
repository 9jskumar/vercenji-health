import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { allCategories, productFormValues } from "@/lib/admin-products";
import { deleteProductImage } from "@/lib/actions/catalogue";
import { mediaUrl } from "@/lib/catalogue";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantForm } from "@/components/admin/VariantForm";
import { ImageUpload } from "@/components/admin/ImageUpload";

const shopPath = (vertical: string, slug: string) => (vertical === "LIFESTYLE" ? `/lifestyle/${slug}` : vertical === "NUTRITION" ? `/nutrition/${slug}` : null);

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireStaff(PERMISSIONS.catalogueManage);
  const { id } = await params;
  const { created } = await searchParams;
  const [values, categories, variants, images] = await Promise.all([
    productFormValues(id),
    allCategories(),
    db.productVariant.findMany({ where: { productId: id }, orderBy: { createdAt: "asc" } }),
    db.productImage.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!values) notFound();
  const live = values.status === "ACTIVE" ? shopPath(values.vertical, values.slug) : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/products" className="text-sm font-semibold text-green underline">← All products</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">{values.name}</h1>
        {live && <Link href={live} className="text-sm font-semibold text-green underline" target="_blank">View in shop ↗</Link>}
      </div>
      {created && <p role="status" className="m-0 rounded-xl bg-[#DCE6DC] p-3 text-sm font-semibold text-forest">Product created. Now add its options and images below.</p>}

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Options, prices and stock</h2>
        <p className="m-0 text-sm text-stone">Prices are in rupees and include GST. The product shows in the shop only when it is Active and has at least one option on sale.</p>
        {variants.map((v) => <VariantForm key={v.id} productId={id} variant={v} />)}
        <h3 className="m-0 mt-2 text-sm font-bold">Add an option</h3>
        <VariantForm productId={id} />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Images</h2>
        {images.length > 0 && (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
            {images.map((img) => (
              <li key={img.id} className="flex flex-col gap-2">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-ivory">
                  <Image src={mediaUrl(img.path)} alt={img.alt} fill sizes="200px" className="object-cover" unoptimized />
                </div>
                <span className="text-xs text-stone">{img.alt}</span>
                <form action={deleteProductImage}>
                  <input type="hidden" name="imageId" value={img.id} />
                  <button type="submit" className="text-xs font-semibold text-[#9B2C2C] underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ImageUpload productId={id} />
      </section>

      <ProductForm values={values} categories={categories} />
    </div>
  );
}
