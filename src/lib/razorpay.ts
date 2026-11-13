import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay is used only through its hosted checkout: card and bank details never reach this server.
// Keys live in server environment variables; only the public key id is sent to the browser.

const API = process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1";

function keys() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return { keyId, keySecret };
}

export function paymentsEnabled() {
  const { keyId, keySecret } = keys();
  return Boolean(keyId && keySecret);
}

export function publicKeyId() {
  return keys().keyId;
}

/** True when the configured keys are Razorpay test keys, so the site can say so. */
export function isTestMode() {
  return keys().keyId.startsWith("rzp_test_");
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { keyId, keySecret } = keys();
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    // Log the status and Razorpay's error code only; never the request or the keys.
    const err = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new Error(`Razorpay ${path} failed: ${res.status} ${err?.error?.code ?? ""}`.trim());
  }
  return (await res.json()) as T;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };
export type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string; method?: string };

export function createRazorpayOrder(input: { amountMinor: number; currency: string; receipt: string; orderId: string }) {
  return call<RazorpayOrder>("/orders", {
    method: "POST",
    body: { amount: input.amountMinor, currency: input.currency, receipt: input.receipt, notes: { orderId: input.orderId } },
  });
}

export function fetchPayment(paymentId: string) {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

function safeEqualHex(expectedHex: string, given: string) {
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signature returned to the browser after a successful checkout. */
export function verifyPaymentSignature(providerOrderId: string, paymentId: string, signature: string) {
  const { keySecret } = keys();
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${providerOrderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** X-Razorpay-Signature on webhooks: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
