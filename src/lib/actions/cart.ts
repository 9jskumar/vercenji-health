"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCart, getOrCreateCart, MAX_QTY } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export type CartState = { ok?: boolean; error?: string };

const addSchema = z.object({ variantId: z.string().min(1).max(64), quantity: z.coerce.number().int().min(1).max(MAX_QTY) });

export async function addToCart(_prev: CartState, form: FormData): Promise<CartState> {
  if (!rateLimit(`cart:${await clientIp()}`, 60, 60_000)) return { error: "Please slow down and try again." };
  const parsed = addSchema.safeParse({ variantId: form.get("variantId"), quantity: form.get("quantity") ?? 1 });
  if (!parsed.success) return { error: "Please choose an option and quantity." };
  const { variantId, quantity } = parsed.data;

  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { status: true } } } });
  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") return { error: "This item is not available." };

  const cart = await getOrCreateCart();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const limit = variant.allowPreorder ? MAX_QTY : Math.min(MAX_QTY, variant.stock);
  const next = (existing?.quantity ?? 0) + quantity;
  if (limit <= 0) return { error: "Sorry, this item is out of stock." };
  if (next > limit) return { error: `You can add up to ${limit} of this item.` };

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: next },
  });
  revalidatePath("/cart");
  return { ok: true };
}

const qtySchema = z.object({ itemId: z.string().min(1).max(64), quantity: z.coerce.number().int().min(0).max(MAX_QTY) });

export async function setCartQuantity(form: FormData) {
  const parsed = qtySchema.safeParse({ itemId: form.get("itemId"), quantity: form.get("quantity") });
  if (!parsed.success) return;
  const cart = await getCart();
  if (!cart) return;
  const { itemId, quantity } = parsed.data;
  // The item must belong to this visitor's cart.
  if (quantity === 0) await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  else await db.cartItem.updateMany({ where: { id: itemId, cartId: cart.id }, data: { quantity } });
  revalidatePath("/cart");
}
