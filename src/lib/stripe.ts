import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Stripe is used only through its hosted Checkout page: card details never reach this server.
// The secret key and webhook secret live in server environment variables and are never sent to the browser.

const API = process.env.STRIPE_API_BASE || "https://api.stripe.com/v1";
const secretKey = () => process.env.STRIPE_SECRET_KEY ?? "";

export const stripeEnabled = () => secretKey().length > 0;
export const stripeTestMode = () => secretKey().startsWith("sk_test_") || secretKey().startsWith("rk_test_");

/** Stripe expects nested form fields, e.g. line_items[0][price_data][currency]=aed. */
function form(obj: Record<string, unknown>, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function call<T>(path: string, init?: { method?: string; body?: Record<string, unknown>; idempotencyKey?: string }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.idempotencyKey && { "Idempotency-Key": init.idempotencyKey }),
    },
    body: init?.body ? form(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    // Log the status and Stripe's error code only; never the request or the key.
    const err = (await res.json().catch(() => null)) as { error?: { code?: string; type?: string } } | null;
    throw new Error(`Stripe ${path} failed: ${res.status} ${err?.error?.code ?? err?.error?.type ?? ""}`.trim());
  }
  return (await res.json()) as T;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired" | null;
  payment_intent: string | { id: string } | null;
  client_reference_id: string | null;
};

export const paymentIntentId = (s: CheckoutSession) => (typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? s.id);

export function createCheckoutSession(input: {
  orderId: string;
  orderNumber: string;
  currency: string;
  lines: { name: string; unitMinor: number; quantity: number }[];
  shippingMinor: number;
  email: string;
  siteUrl: string;
}) {
  const cur = input.currency.toLowerCase();
  const line_items: Record<string, unknown> = {};
  input.lines.forEach((l, i) => {
    line_items[i] = { quantity: l.quantity, price_data: { currency: cur, unit_amount: l.unitMinor, product_data: { name: l.name.slice(0, 250) } } };
  });
  return call<CheckoutSession>("/checkout/sessions", {
    method: "POST",
    idempotencyKey: `order-${input.orderId}`,
    body: {
      mode: "payment",
      line_items,
      ...(input.shippingMinor > 0 && {
        shipping_options: { 0: { shipping_rate_data: { type: "fixed_amount", display_name: "Delivery", fixed_amount: { amount: input.shippingMinor, currency: cur } } } },
      }),
      customer_email: input.email,
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      payment_intent_data: { description: `Vercenji order ${input.orderNumber}`, metadata: { orderId: input.orderId, orderNumber: input.orderNumber } },
      success_url: `${input.siteUrl}/checkout/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.siteUrl}/checkout?payment=cancelled`,
    },
  });
}

export function retrieveCheckoutSession(id: string) {
  return call<CheckoutSession>(`/checkout/sessions/${encodeURIComponent(id)}`);
}

/**
 * Stripe-Signature header: "t=<unix time>,v1=<hex HMAC-SHA256 of `${t}.${body}`>". Rejects events
 * older than five minutes, so a captured request cannot be replayed later.
 */
export function verifyStripeSignature(rawBody: string, header: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret || !header) return false;
  const parts = header.split(",").map((p) => p.split("=", 2) as [string, string]);
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isFinite(t) || sigs.length === 0 || Math.abs(nowSeconds - t) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"), "utf8");
  return sigs.some((s) => {
    const given = Buffer.from(s, "utf8");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
