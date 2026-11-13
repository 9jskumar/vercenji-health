import "server-only";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import type { cartLines } from "@/lib/cart";

/** Remembers the visitor's latest order so its confirmation page can be shown to them. */
export const ORDER_COOKIE = "vh_order";

type Line = ReturnType<typeof cartLines>[number];

/**
 * Delivery charge, set on the server by the owner (plan: rates to be confirmed before launch).
 * SHIPPING_FLAT_RUPEES: charge per order. SHIPPING_FREE_ABOVE_RUPEES: subtotal at or above which delivery is free.
 * Both default to 0, which means no delivery charge.
 */
export function deliveryChargeMinor(subtotalMinor: number) {
  const flat = Math.round(Number(process.env.SHIPPING_FLAT_RUPEES || 0) * 100);
  const freeAbove = Math.round(Number(process.env.SHIPPING_FREE_ABOVE_RUPEES || 0) * 100);
  if (!Number.isFinite(flat) || flat <= 0) return 0;
  if (freeAbove > 0 && subtotalMinor >= freeAbove) return 0;
  return flat;
}

/** GST included in a tax-inclusive amount, e.g. 18% of an inclusive ₹118 is ₹18. */
export function includedGst(amountMinor: number, rateBps: number | null) {
  if (!rateBps) return 0;
  return Math.round((amountMinor * rateBps) / (10_000 + rateBps));
}

export function priceLines(lines: Line[]) {
  const subtotalMinor = lines.reduce((s, l) => s + l.lineMinor, 0);
  const shippingMinor = deliveryChargeMinor(subtotalMinor);
  const taxMinor = lines.reduce((s, l) => s + includedGst(l.lineMinor, l.product.gstRateBps), 0);
  return { subtotalMinor, shippingMinor, taxMinor, totalMinor: subtotalMinor + shippingMinor };
}

export function newOrderNumber(year: number) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 7; i++) s += alphabet[randomInt(alphabet.length)];
  return `VH-${year}-${s}`;
}

type PaymentFacts = { providerOrderId: string; providerPaymentId: string; amountMinor: number; currency: string; method?: string; raw?: object };

/**
 * Marks an order paid once a verified payment for the full amount is captured. Safe to call more
 * than once (browser callback and webhook can both arrive): only the first call changes anything.
 */
export async function recordCapturedPayment(p: PaymentFacts): Promise<"paid" | "already" | "mismatch" | "unknown"> {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { providerOrderId: p.providerOrderId }, include: { order: { include: { items: true } } } });
    if (!payment) return "unknown";
    const order = payment.order;

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: p.providerPaymentId,
        status: "CAPTURED",
        method: p.method?.slice(0, 40),
        ...(p.raw && { rawEvent: p.raw }),
      },
    });

    if (p.amountMinor !== payment.amountMinor || p.currency !== payment.currency || payment.amountMinor !== order.totalMinor) {
      await tx.orderEvent.create({
        data: { orderId: order.id, status: order.status, note: `Payment ${p.providerPaymentId} amount ${p.amountMinor} ${p.currency} does not match the order. Check before shipping.` },
      });
      return "mismatch";
    }

    const moved = await tx.order.updateMany({ where: { id: order.id, status: "PENDING_PAYMENT" }, data: { status: "PAID" } });
    if (moved.count === 0) {
      if (order.status === "CANCELLED") {
        await tx.orderEvent.create({ data: { orderId: order.id, status: order.status, note: `Payment ${p.providerPaymentId} captured after the order was cancelled. Refund needed.` } });
      }
      return "already";
    }

    await tx.orderEvent.create({ data: { orderId: order.id, status: "PAID", note: `Payment ${p.providerPaymentId} captured${p.method ? ` (${p.method})` : ""}.` } });

    // Stock is taken when payment is captured. If it has run out meanwhile, staff are told on the order.
    for (const item of order.items) {
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { allowPreorder: true } });
      const where = variant?.allowPreorder ? { id: item.variantId } : { id: item.variantId, stock: { gte: item.quantity } };
      const dec = await tx.productVariant.updateMany({ where, data: { stock: { decrement: item.quantity } } });
      if (dec.count === 1) {
        await tx.stockMovement.create({ data: { variantId: item.variantId, delta: -item.quantity, reason: "ORDER_PLACED", orderId: order.id } });
      } else {
        await tx.orderEvent.create({ data: { orderId: order.id, status: "PAID", note: `Not enough stock for ${item.sku} (${item.quantity} ordered). Contact the customer.` } });
      }
    }
    return "paid";
  });
}

export async function recordPaymentStatus(providerOrderId: string, status: "AUTHORIZED" | "FAILED", providerPaymentId?: string) {
  const payment = await db.payment.findUnique({ where: { providerOrderId } });
  if (!payment || payment.status === "CAPTURED" || payment.status === "REFUNDED") return;
  await db.payment.update({
    where: { id: payment.id },
    // A failed attempt does not take the payment id: the customer may retry the same order successfully.
    data: { status, ...(status === "AUTHORIZED" && providerPaymentId && { providerPaymentId }) },
  });
}
