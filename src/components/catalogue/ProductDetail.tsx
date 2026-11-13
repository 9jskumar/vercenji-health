import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asPairs, asStringList, getProduct, mediaUrl } from "@/lib/catalogue";
import { productDisclaimer } from "@/lib/site";
import type { Vertical } from "@/generated/prisma/enums";
import { AddToCart } from "./AddToCart";

type Props = { vertical: Vertical; params: Promise<{ slug: string }>; section: { label: string; href: string } };

export async function ProductDetail({ vertical, params, section }: Props) {
  await connection();
  const { slug } = await params;
  const p = await getProduct(vertical, slug);
  if (!p || p.variants.length === 0) notFound();

  const claims = asStringList(p.approvedClaims);
  const specs = asPairs(p.specifications);
  const regulatory = asPairs(p.regulatoryInfo);
  const blocks: [string, string | null][] = [
    ["Description", p.description],
    ["Ingredients and composition", p.ingredients],
    ["Directions for use", p.directions],
    ["Warnings", p.warnings],
    ["Size guide", p.sizeGuide],
    ["Warranty", p.warranty],
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.subtitle ?? undefined,
    brand: { "@type": "Brand", name: p.brand ?? "Vercenji" },
    image: p.images.map((i) => mediaUrl(i.path)),
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: (v.priceMinor / 100).toFixed(2),
      priceCurrency: v.currency,
      availability: v.stock > 0 ? "https://schema.org/InStock" : v.allowPreorder ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 pt-8 pb-[88px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-stone">
        <Link href="/" className="text-green">Home</Link> / <Link href={section.href} className="text-green">{section.label}</Link> / {p.name}
      </nav>
      <div className="flex flex-wrap gap-10">
        <div className="flex flex-[1_1_440px] flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-[28px] bg-white ring-1 ring-line">
            {p.images[0] ? (
              <Image src={mediaUrl(p.images[0].path)} alt={p.images[0].alt} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" priority unoptimized />
            ) : (
              <span className="flex h-full items-center justify-center font-serif text-5xl text-green/70">{p.name}</span>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {p.images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  <Image src={mediaUrl(img.path)} alt={img.alt} fill sizes="150px" className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-[1_1_440px] flex-col gap-5">
          <span className="eyebrow">{p.brand ?? p.categories[0]?.category.name}</span>
          <h1 className="m-0 font-serif text-[clamp(36px,4vw,52px)] leading-tight font-normal text-forest">{p.name}</h1>
          {p.subtitle && <p className="m-0 text-lg text-[#45453F]">{p.subtitle}</p>}
          {claims.length > 0 && (
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[#45453F]">
              {claims.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
          <AddToCart variants={p.variants.map((v) => ({ id: v.id, name: v.name, priceMinor: v.priceMinor, mrpMinor: v.mrpMinor, currency: v.currency, stock: v.stock, allowPreorder: v.allowPreorder }))} />
          {vertical === "NUTRITION" && (
            <p className="m-0 rounded-2xl bg-white p-4 text-sm leading-relaxed text-stone ring-1 ring-line">{productDisclaimer}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {blocks.filter(([, body]) => body).map(([title, body]) => (
          <section key={title} className="rounded-3xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-2 font-serif text-2xl font-normal text-forest">{title}</h2>
            <p className="m-0 leading-relaxed whitespace-pre-wrap text-[#45453F]">{body}</p>
          </section>
        ))}
        {[["Specifications", specs], ["Manufacturing and regulatory information", regulatory]].map(([title, rows]) =>
          (rows as [string, string][]).length > 0 ? (
            <section key={title as string} className="rounded-3xl bg-white p-6 ring-1 ring-line">
              <h2 className="m-0 mb-3 font-serif text-2xl font-normal text-forest">{title as string}</h2>
              <dl className="m-0 grid grid-cols-[minmax(120px,40%)_1fr] gap-x-4 gap-y-2 text-[15px]">
                {(rows as [string, string][]).map(([k, v]) => (
                  <div key={k} className="contents"><dt className="text-stone">{k}</dt><dd className="m-0">{v}</dd></div>
                ))}
              </dl>
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}
