"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { checkUploads, storeFiles } from "@/lib/uploads";
import { Prisma } from "@/generated/prisma/client";
import { ProductStatus, Vertical } from "@/generated/prisma/enums";

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const text = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === "" ? null : v)).nullable().optional();

/** "Label: value" per line → [{label, value}] */
function parsePairs(raw: string | null | undefined) {
  if (!raw) return null;
  const rows = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : null;
    });
  if (rows.some((r) => r === null)) throw new Error("Each line must look like Label: value");
  return rows.length ? rows : null;
}

const lines = (raw: string | null | undefined) => {
  const list = (raw ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  return list.length ? list : null;
};

const productSchema = z.object({
  id: z.string().max(64).optional(),
  vertical: z.enum(Vertical),
  name: z.string().trim().min(2, "Enter a product name.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only, e.g. foci-60-capsules.")
    .max(120),
  subtitle: text(200),
  brand: text(80),
  description: text(8000),
  ingredients: text(8000),
  directions: text(4000),
  warnings: text(4000),
  approvedClaims: text(4000),
  claimsApprovedBy: text(120),
  regulatoryInfo: text(4000),
  specifications: text(4000),
  warranty: text(4000),
  sizeGuide: text(4000),
  hsnCode: z.string().trim().regex(/^(\d{4,8})?$/, "HSN is 4 to 8 digits.").optional(),
  gstRate: z.string().trim().regex(/^(\d{1,2}(\.\d{1,2})?)?$/, "Enter a GST rate such as 18 or 5.").optional(),
  status: z.enum(ProductStatus),
  seoTitle: text(70),
  seoDescription: text(170),
});

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff(PERMISSIONS.catalogueManage);
  const raw = Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$ACTION")));
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  let specifications, regulatoryInfo;
  try {
    specifications = parsePairs(d.specifications);
    regulatoryInfo = parsePairs(d.regulatoryInfo);
  } catch (e) {
    return { error: (e as Error).message, fieldErrors: { specifications: "Use one Label: value per line." } };
  }
  const claims = lines(d.approvedClaims);
  const audience = form.getAll("audience").map(String).filter((a) => ["men", "women", "boys", "girls", "unisex", "family"].includes(a));
  const categoryIds = form.getAll("categoryIds").map(String).slice(0, 20);

  // A supplement goes live only with a recorded sign-off for its claims and label (plan decision 10).
  if (d.status === "ACTIVE" && d.vertical === "NUTRITION" && !d.claimsApprovedBy) {
    return {
      error: "Nutrition products need the name of the person who approved the label and claims before they can be made Active.",
      fieldErrors: { claimsApprovedBy: "Required to make a nutrition product Active." },
    };
  }

  const existing = d.id ? await db.product.findUnique({ where: { id: d.id }, select: { claimsApprovedBy: true, approvedClaims: true, status: true } }) : null;
  const claimsChanged = !existing || existing.claimsApprovedBy !== d.claimsApprovedBy || JSON.stringify(existing.approvedClaims) !== JSON.stringify(claims);

  const data = {
    vertical: d.vertical,
    name: d.name,
    slug: d.slug,
    subtitle: d.subtitle,
    brand: d.brand,
    description: d.description,
    ingredients: d.ingredients,
    directions: d.directions,
    warnings: d.warnings,
    approvedClaims: claims ?? Prisma.DbNull,
    claimsApprovedBy: d.claimsApprovedBy,
    ...(claimsChanged && { claimsApprovedAt: d.claimsApprovedBy ? new Date() : null }),
    regulatoryInfo: regulatoryInfo ?? Prisma.DbNull,
    specifications: specifications ?? Prisma.DbNull,
    warranty: d.warranty,
    sizeGuide: d.sizeGuide,
    audience: audience.length ? audience : Prisma.DbNull,
    hsnCode: d.hsnCode || null,
    gstRateBps: d.gstRate ? Math.round(Number(d.gstRate) * 100) : null,
    status: d.status,
    seo: d.seoTitle || d.seoDescription ? { title: d.seoTitle, description: d.seoDescription } : Prisma.DbNull,
  };

  try {
    const product = d.id
      ? await db.product.update({ where: { id: d.id }, data })
      : await db.product.create({ data });
    await db.productCategory.deleteMany({ where: { productId: product.id } });
    if (categoryIds.length) {
      const valid = await db.category.findMany({ where: { id: { in: categoryIds }, vertical: d.vertical }, select: { id: true } });
      await db.productCategory.createMany({ data: valid.map((c) => ({ productId: product.id, categoryId: c.id })) });
    }
    await audit({
      actorId: staff.id,
      action: d.id ? "product.update" : "product.create",
      entityType: "Product",
      entityId: product.id,
      before: existing ? { status: existing.status } : undefined,
      after: { status: d.status, claimsApprovedBy: d.claimsApprovedBy ?? null },
    });
    revalidatePath("/admin/products");
    if (!d.id) redirect(`/admin/products/${product.id}?created=1`);
    revalidatePath(`/admin/products/${product.id}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Another product already uses this web address.", fieldErrors: { slug: "Already in use." } };
    }
    throw e;
  }
}

const rupees = (label: string) =>
  z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/, `Enter ${label} in rupees, e.g. 360 or 360.50.`).transform((v) => Math.round(Number(v) * 100));

const variantSchema = z
  .object({
    productId: z.string().min(1).max(64),
    variantId: z.string().max(64).optional(),
    sku: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9._-]+$/, "SKU: letters, numbers, dot, dash or underscore."),
    name: z.string().trim().min(1, "Name the option, e.g. 60 capsules.").max(80),
    mrp: rupees("the MRP"),
    price: rupees("the price"),
    stock: z.coerce.number().int().min(0).max(1_000_000),
    lowStockAt: z.coerce.number().int().min(0).max(100_000),
    weightGrams: z.string().trim().regex(/^\d{0,6}$/).optional(),
    allowPreorder: z.literal("on").optional(),
    isActive: z.literal("on").optional(),
  })
  .refine((v) => v.price <= v.mrp, { path: ["price"], message: "The price cannot be above the MRP." });

export async function saveVariant(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff(PERMISSIONS.catalogueManage);
  const raw = Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$ACTION") && v !== ""));
  const parsed = variantSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the option." };
  const v = parsed.data;
  const data = {
    sku: v.sku.toUpperCase(),
    name: v.name,
    mrpMinor: v.mrp,
    priceMinor: v.price,
    lowStockAt: v.lowStockAt,
    weightGrams: v.weightGrams ? Number(v.weightGrams) : null,
    allowPreorder: v.allowPreorder === "on",
    isActive: v.isActive === "on",
  };
  try {
    if (v.variantId) {
      const before = await db.productVariant.findFirst({ where: { id: v.variantId, productId: v.productId } });
      if (!before) return { error: "This option no longer exists." };
      await db.$transaction([
        db.productVariant.update({ where: { id: before.id }, data: { ...data, stock: v.stock } }),
        ...(before.stock !== v.stock
          ? [db.stockMovement.create({ data: { variantId: before.id, delta: v.stock - before.stock, reason: "MANUAL_ADJUSTMENT", actorId: staff.id } })]
          : []),
      ]);
      await audit({ actorId: staff.id, action: "variant.update", entityType: "ProductVariant", entityId: before.id, before: { priceMinor: before.priceMinor, stock: before.stock }, after: { priceMinor: v.price, stock: v.stock } });
    } else {
      const created = await db.productVariant.create({ data: { ...data, productId: v.productId, stock: v.stock } });
      if (v.stock > 0) await db.stockMovement.create({ data: { variantId: created.id, delta: v.stock, reason: "PURCHASE_RECEIVED", note: "Opening stock", actorId: staff.id } });
      await audit({ actorId: staff.id, action: "variant.create", entityType: "ProductVariant", entityId: created.id, after: { priceMinor: v.price, stock: v.stock } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Another option already uses this SKU." };
    throw e;
  }
  revalidatePath(`/admin/products/${v.productId}`);
  return { ok: true };
}

export async function uploadProductImages(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff(PERMISSIONS.catalogueManage);
  const productId = String(form.get("productId") ?? "");
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  if (!alt) return { error: "Describe the image for people using screen readers, e.g. Foci 60-capsule jar, front view." };
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, _count: { select: { images: true } } } });
  if (!product) return { error: "Product not found." };
  const checked = await checkUploads(form.getAll("images").filter((f): f is File => f instanceof File), ["image/jpeg", "image/png"]);
  if ("error" in checked) return { error: checked.error };
  if (checked.files.length === 0) return { error: "Choose at least one image." };
  const paths = await storeFiles(`products/${product.id}`, checked.files);
  await db.productImage.createMany({
    data: paths.map((path, i) => ({ productId: product.id, path, alt, sortOrder: product._count.images + i })),
  });
  await audit({ actorId: staff.id, action: "product.images_add", entityType: "Product", entityId: product.id, after: { count: paths.length } });
  revalidatePath(`/admin/products/${product.id}`);
  return { ok: true };
}

export async function deleteProductImage(form: FormData) {
  const staff = await requireStaff(PERMISSIONS.catalogueManage);
  const id = String(form.get("imageId") ?? "");
  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return;
  await db.productImage.delete({ where: { id } });
  // The file stays on disk so cached pages keep working; a cleanup job can remove orphans later.
  await audit({ actorId: staff.id, action: "product.image_delete", entityType: "Product", entityId: img.productId, before: { path: img.path } });
  revalidatePath(`/admin/products/${img.productId}`);
}

const categorySchema = z.object({
  vertical: z.enum(Vertical),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createCategory(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff(PERMISSIONS.catalogueManage);
  const parsed = categorySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the category." };
  try {
    const c = await db.category.create({ data: parsed.data });
    await audit({ actorId: staff.id, action: "category.create", entityType: "Category", entityId: c.id, after: parsed.data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "That web address is already used by another category." };
    throw e;
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}
