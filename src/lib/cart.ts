import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/auth/crypto";

const COOKIE = "vh_cart";
export const MAX_QTY = 10;

async function cartKey(create: boolean): Promise<string | null> {
  const jar = await cookies();
  let token = jar.get(COOKIE)?.value;
  if (!token && create) {
    token = randomToken();
    jar.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return token ? sha256(token) : null;
}

export async function getCart() {
  const key = await cartKey(false);
  if (!key) return null;
  return db.cart.findUnique({
    where: { guestKey: key },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: { variant: { include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } } },
      },
    },
  });
}

export async function getOrCreateCart() {
  const key = (await cartKey(true))!;
  return db.cart.upsert({ where: { guestKey: key }, create: { guestKey: key }, update: {} });
}

export async function cartCount(): Promise<number> {
  const key = await cartKey(false);
  if (!key) return 0;
  const r = await db.cartItem.aggregate({ where: { cart: { guestKey: key } }, _sum: { quantity: true } });
  return r._sum.quantity ?? 0;
}

/** Lines that can still be bought, with the reason when one cannot. */
export function cartLines(cart: NonNullable<Awaited<ReturnType<typeof getCart>>>) {
  return cart.items.map((i) => {
    const v = i.variant;
    const sellable = v.isActive && v.product.status === "ACTIVE";
    const available = v.allowPreorder ? MAX_QTY : Math.min(MAX_QTY, v.stock);
    const problem = !sellable ? "No longer available" : available <= 0 ? "Out of stock" : i.quantity > available ? `Only ${available} available` : null;
    return { item: i, variant: v, product: v.product, lineMinor: v.priceMinor * i.quantity, problem };
  });
}
