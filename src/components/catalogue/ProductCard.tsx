import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalogue";
import { mediaUrl } from "@/lib/catalogue";
import { formatMoney } from "@/lib/money";

export function ProductCard({ product, href }: { product: ProductCardData; href: string }) {
  const v = product.variants[0];
  const img = product.images[0];
  const multiple = new Set(product.variants.map((x) => x.priceMinor)).size > 1;
  const inStock = product.variants.some((x) => x.stock > 0 || x.allowPreorder);
  return (
    <article className="card-lift flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
      <Link href={href} className="relative block aspect-square bg-ivory" aria-label={`View ${product.name}`}>
        {img ? (
          <Image src={mediaUrl(img.path)} alt={img.alt} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full items-center justify-center font-serif text-3xl text-green/70">{product.name}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-semibold tracking-[0.08em] text-stone uppercase">
          {product.brand ?? product.categories[0]?.category.name}
        </span>
        <Link href={href} className="font-serif text-xl text-forest no-underline hover:underline">{product.name}</Link>
        {product.subtitle && <span className="text-sm text-stone">{product.subtitle}</span>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="text-lg font-bold">
            {multiple && <span className="text-sm font-normal text-stone">From </span>}
            {formatMoney(v.priceMinor, v.currency)}
          </span>
          {!inStock && <span className="text-xs font-semibold text-[#9B2C2C]">Out of stock</span>}
        </div>
      </div>
    </article>
  );
}
