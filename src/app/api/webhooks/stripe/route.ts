import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { paymentIntentId, verifyStripeSignature, type CheckoutSession } from "@/lib/stripe";
import { recordCapturedPayment, recordPaymentStatus } from "@/lib/orders";

// Stripe calls this URL for Checkout events (UAE store). Only requests signed with the webhook secret
// are accepted, and each event id is processed once, so Stripe's retries are harmless.

type Event = { id: string; type: string; data?: { object?: CheckoutSession & { object?: string } } };

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 512 * 1024) return new Response("Too large", { status: 413 });
  if (!verifyStripeSignature(body, request.headers.get("stripe-signature") ?? "")) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: Event;
  try {
    event = JSON.parse(body) as Event;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  const eventId = typeof event.id === "string" ? event.id.slice(0, 64) : "";
  if (!eventId) return new Response("Missing event id", { status: 400 });

  try {
    await db.webhookEvent.create({ data: { id: eventId, provider: "stripe", type: String(event.type).slice(0, 64) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return Response.json({ ok: true, duplicate: true });
    throw e;
  }

  try {
    const s = event.data?.object;
    if (s?.object === "checkout.session" && s.id) {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded":
          if (s.payment_status === "paid" && s.amount_total !== null && s.currency) {
            const minimal = { event: event.type, session: { id: s.id, payment_intent: paymentIntentId(s), amount_total: s.amount_total, currency: s.currency, payment_status: s.payment_status } };
            await recordCapturedPayment({ providerOrderId: s.id, providerPaymentId: paymentIntentId(s), amountMinor: s.amount_total, currency: s.currency.toUpperCase(), method: "stripe", raw: minimal });
          }
          break;
        case "checkout.session.async_payment_failed":
        case "checkout.session.expired":
          await recordPaymentStatus(s.id, "FAILED");
          break;
      }
    }
    await db.webhookEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
    return Response.json({ ok: true });
  } catch (e) {
    // Forget the event so Stripe's retry is processed again.
    console.error("stripe webhook failed", eventId, e);
    await db.webhookEvent.delete({ where: { id: eventId } }).catch(() => {});
    return new Response("Error", { status: 500 });
  }
}
