import "server-only";
import { db } from "@/lib/db";
import { asPairs, asStringList } from "@/lib/catalogue";
import { dateTime } from "@/content/admin";
import type { ProductFormValues } from "@/components/admin/ProductForm";

export const allCategories = () =>
  db.category.findMany({ orderBy: [{ vertical: "asc" }, { sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, vertical: true } });

export async function productFormValues(id: string): Promise<ProductFormValues | null> {
  const p = await db.product.findUnique({ where: { id }, include: { categories: true } });
  if (!p) return null;
  const seo = (p.seo ?? {}) as { title?: string; description?: string };
  const pairs = (v: Parameters<typeof asPairs>[0]) => asPairs(v).map(([k, val]) => `${k}: ${val}`).join("\n");
  return {
    id: p.id,
    vertical: p.vertical,
    name: p.name,
    slug: p.slug,
    subtitle: p.subtitle ?? "",
    brand: p.brand ?? "",
    description: p.description ?? "",
    ingredients: p.ingredients ?? "",
    directions: p.directions ?? "",
    warnings: p.warnings ?? "",
    approvedClaims: asStringList(p.approvedClaims).join("\n"),
    claimsApprovedBy: p.claimsApprovedBy ?? "",
    claimsApprovedAt: p.claimsApprovedAt ? dateTime(p.claimsApprovedAt) : null,
    regulatoryInfo: pairs(p.regulatoryInfo),
    specifications: pairs(p.specifications),
    warranty: p.warranty ?? "",
    sizeGuide: p.sizeGuide ?? "",
    audience: asStringList(p.audience),
    hsnCode: p.hsnCode ?? "",
    gstRate: p.gstRateBps != null ? String(p.gstRateBps / 100) : "",
    status: p.status,
    seoTitle: seo.title ?? "",
    seoDescription: seo.description ?? "",
    categoryIds: p.categories.map((c) => c.categoryId),
  };
}

export const emptyProduct = (vertical = "NUTRITION"): ProductFormValues => ({
  vertical, name: "", slug: "", subtitle: "", brand: "", description: "", ingredients: "", directions: "", warnings: "",
  approvedClaims: "", claimsApprovedBy: "", claimsApprovedAt: null, regulatoryInfo: "", specifications: "", warranty: "",
  sizeGuide: "", audience: [], hsnCode: "", gstRate: "", status: "DRAFT", seoTitle: "", seoDescription: "", categoryIds: [],
});
