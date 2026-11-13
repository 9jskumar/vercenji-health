"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { cartLines, getCart } from "@/lib/cart";
import { ORDER_COOKIE, newOrderNumber, priceLines, recordCapturedPayment, recordPaymentStatus } from "@/lib/orders";
import { createRazorpayOrder, fetchPayment, paymentsEnabled, publicKeyId, verifyPaymentSignature } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { indianStates } from "@/content/checkout";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  pay?: {
    keyId: string;
    providerOrderId: string;
    amountMinor: number;
    currency: string;
    orderNumber: string;
    prefill: { name: string; email: string; contact: string };
  };
};

const schema = z.object({
  email: z.email("Please enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Please enter a 10-digit Indian mobile number.")),
  fullName: z.string().trim().min(2, "Please enter the recipient's name.").max(120),
  line1: z.string().trim().min(3, "Please enter the house number and street.").max(160),
  line2: z.string().trim().max(160).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Please enter the city.").max(80),
  state: z.string().refine((v) => (indianStates as readonly string[]).includes(v), "Please choose a state."),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Please enter a 6-digit PIN code."),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Please enter a valid 15-character GSTIN, or leave it blank.")
    .optional(),
  notes: z.string().trim().max(500).optional(),
  consentTerms: z.literal("on", { error: "Please accept the terms of sale to continue." }),
  marketing: z.literal("on").optional(),
});

export async function placeOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  if (!paymentsEnabled()) return { error: "Online payment is not switched on yet. Please try again later." };
  if (!rateLimit(`checkout:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: "Too many checkout attempts from your connection. Please try again in an hour." };
  }

  const raw = Object.fromEntries([...form.entries()].filter(([k, v]) => !k.startsWith("$ACTION") && typeof v === "string" && v.trim() !== ""));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  // Prices and stock always come from the database, never from the browser.
  const cart = await getCart();
  const lines = cart ? cartLines(cart) : [];
  if (lines.length === 0) return { error: "Your cart is empty." };
  const problem = lines.find((l) => l.problem);
  if (problem) return { error: `${problem.product.name} (${problem.variant.name}): ${problem.problem}. Please update your cart.` };
  const currencies = new Set(lines.map((l) => l.variant.currency));
  if (currencies.size !== 1) return { error: "Your cart mixes currencies. Please check out items separately." };
  const currency = lines[0].variant.currency;
  const totals = priceLines(lines);
  if (totals.totalMinor < 100) return { error: "The order total is too small to pay online." };

  const phone = d.phone.startsWith("+91") ? d.phone : `+91${d.phone}`;
  const address = {
    fullName: d.fullName, phone, line1: d.line1, line2: d.line2 ?? null, landmark: d.landmark ?? null,
    city: d.city, state: d.state, postalCode: d.postalCode, country: "IN",
  };

  let order: { id: string; number: string } | null = null;
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await db.order.create({
        data: {
          number: newOrderNumber(year),
          guestEmail: d.email.toLowerCase(),
          guestPhone: phone,
          currency,
          ...totals,
          shippingAddress: address,
          gstinForInvoice: d.gstin,
          notes: d.notes,
          items: {
            create: lines.map((l) => ({
              variantId: l.variant.id,
              productName: l.product.name,
              variantName: l.variant.name,
              sku: l.variant.sku,
              unitPriceMinor: l.variant.priceMinor,
              quantity: l.item.quantity,
              gstRateBps: l.product.gstRateBps,
              hsnCode: l.product.hsnCode,
            })),
          },
          events: { create: { status: "PENDING_PAYMENT", note: "Order placed online." } },
        },
        select: { id: true, number: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      console.error("order create failed", e);
      return { error: "Something went wrong on our side. Please try again in a few minutes." };
    }
  }
  if (!order) return { error: "Something went wrong on our side. Please try again in a few minutes." };

  try {
    const rp = await createRazorpayOrder({ amountMinor: totals.totalMinor, currency, receipt: order.number, orderId: order.id });
    await db.payment.create({ data: { orderId: order.id, providerOrderId: rp.id, amountMinor: totals.totalMinor, currency } });
    if (d.marketing) {
      const email = d.email.toLowerCase();
      await db.newsletterSubscriber.upsert({
        where: { email },
        create: { email, consentAt: new Date(), source: "checkout" },
        update: { consentAt: new Date(), unsubscribedAt: null },
      });
    }
    (await cookies()).set(ORDER_COOKIE, order.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return {
      pay: {
        keyId: publicKeyId(),
        providerOrderId: rp.id,
        amountMinor: totals.totalMinor,
        currency,
        orderNumber: order.number,
        prefill: { name: d.fullName, email: d.email, contact: phone },
      },
    };
  } catch (e) {
    console.error("payment setup failed", e);
    await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", events: { create: { status: "CANCELLED", note: "Payment could not be started." } } },
    });
    return { error: "We could not start the payment. Please try again in a few minutes." };
  }
}

const confirmSchema = z.object({
  providerOrderId: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  paymentId: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
});

/**
 * Called by the browser after Razorpay reports success. The signature proves Razorpay issued
 * this payment for this order; the payment itself is then read back from Razorpay. The webhook
 * does the same independently, so the order is confirmed even if this call never arrives.
 */
export async function confirmPayment(input: z.input<typeof confirmSchema>): Promise<{ ok: boolean; error?: string }> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The payment response was not valid." };
  const { providerOrderId, paymentId, signature } = parsed.data;
  if (!verifyPaymentSignature(providerOrderId, paymentId, signature)) {
    console.warn("payment signature mismatch", providerOrderId);
    return { ok: false, error: "We could not verify this payment. If money was taken, it will be confirmed or refunded automatically." };
  }

  const payment = await db.payment.findUnique({ where: { providerOrderId }, select: { orderId: true } });
  if (!payment) return { ok: false, error: "Order not found." };

  try {
    const p = await fetchPayment(paymentId);
    if (p.order_id !== providerOrderId) return { ok: false, error: "We could not verify this payment." };
    if (p.status === "captured") {
      await recordCapturedPayment({ providerOrderId, providerPaymentId: p.id, amountMinor: p.amount, currency: p.currency, method: p.method });
    } else if (p.status === "authorized") {
      await recordPaymentStatus(providerOrderId, "AUTHORIZED", p.id);
    }
  } catch (e) {
    // Razorpay unreachable: the webhook will confirm the order when it arrives.
    console.error("payment lookup failed", e);
  }

  // The order is placed, so the cart is emptied whether the confirmation came from here or the webhook.
  const cart = await getCart();
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { ok: true };
}
