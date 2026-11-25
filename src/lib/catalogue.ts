import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { Vertical } from "@/generated/prisma/enums";

export const SORTS = {
  popular: "Featured",
  low: "Price: low to high",
  high: "Price: high to low",
  name: "Name A to Z",
} as const;
export type SortKey = keyof typeof SORTS;

export type ListParams = { vertical: Vertical; currency: string; category?: string; q?: string; sort?: SortKey; audience?: string };

const cardInclude = (currency: string) =>
  ({
    variants: { where: { isActive: true, currency }, orderBy: { priceMinor: "asc" } },
    images: { orderBy: { sortOrder: "asc" }, take: 1 },
    categories: { include: { category: true } },
  }) satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: ReturnType<typeof cardInclude> }>;

/**
 * Only ACTIVE products with at least one active variant in the visitor's store currency (INR for
 * India, AED for the UAE) are ever shown to customers.
 */
export async function listProducts({ vertical, currency, category, q, sort = "popular", audience }: ListParams) {
  const where: Prisma.ProductWhereInput = {
    vertical,
    status: "ACTIVE",
    variants: { some: { isActive: true, currency } },
    ...(category && { categories: { some: { category: { slug: category } } } }),
    ...(q && { OR: [{ name: { contains: q } }, { subtitle: { contains: q } }, { brand: { contains: q } }] }),
    ...(audience && { audience: { array_contains: [audience] } }),
  };
  const products = await db.product.findMany({
    where,
    include: cardInclude(currency),
    orderBy: sort === "name" ? { name: "asc" } : { updatedAt: "desc" },
    take: 120,
  });
  const from = (p: ProductCardData) => p.variants[0]?.priceMinor ?? 0;
  if (sort === "low") products.sort((a, b) => from(a) - from(b));
  if (sort === "high") products.sort((a, b) => from(b) - from(a));
  return products;
}

export async function listCategories(vertical: Vertical, currency: string) {
  const cats = await db.category.findMany({
    where: { vertical, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { product: { status: "ACTIVE", variants: { some: { isActive: true, currency } } } } } } },
    },
  });
  return cats.filter((c) => c._count.products > 0);
}

export async function getProduct(vertical: Vertical, slug: string, currency: string) {
  return db.product.findFirst({
    where: { vertical, slug, status: "ACTIVE" },
    include: {
      variants: { where: { isActive: true, currency }, orderBy: { priceMinor: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
    },
  });
}

export const mediaUrl = (path: string) => `/media/${path.split("/").map(encodeURIComponent).join("/")}`;

export function asStringList(v: Prisma.JsonValue | null): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function asPairs(v: Prisma.JsonValue | null): [string, string][] {
  if (!v || typeof v !== "object") return [];
  if (Array.isArray(v)) {
    return v.flatMap((row) =>
      row && typeof row === "object" && !Array.isArray(row) && "label" in row && "value" in row
        ? [[String(row.label), String(row.value)] as [string, string]]
        : [],
    );
  }
  return Object.entries(v).map(([k, val]) => [k, String(val)]);
}
