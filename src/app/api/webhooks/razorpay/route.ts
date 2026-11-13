import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { verifyWebhookSignature, type RazorpayPayment } from "@/lib/razorpay";
import { recordCapturedPayment, recordPaymentStatus } from "@/lib/orders";

// Razorpay calls this URL for payment events. Only requests signed with the webhook secret are
// accepted, and each event id is processed once, so Razorpay's retries are harmless.

type Event = { event: string; payload?: { payment?: { entity?: RazorpayPayment } } };

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 256 * 1024) return new Response("Too large", { status: 413 });
  if (!verifyWebhookSignature(body, request.headers.get("x-razorpay-signature") ?? "")) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: Event;
  try {
    event = JSON.parse(body) as Event;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  const eventId = request.headers.get("x-razorpay-event-id")?.slice(0, 64);
  if (!eventId) return new Response("Missing event id", { status: 400 });

  try {
    await db.webhookEvent.create({ data: { id: eventId, provider: "razorpay", type: event.event.slice(0, 64) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return Response.json({ ok: true, duplicate: true });
    throw e;
  }

  try {
    const p = event.payload?.payment?.entity;
    if (p?.order_id) {
      switch (event.event) {
        case "payment.captured":
        case "order.paid":
          if (p.status === "captured") {
            const minimal = { event: event.event, payment: { id: p.id, order_id: p.order_id, amount: p.amount, currency: p.currency, status: p.status, method: p.method } };
            await recordCapturedPayment({ providerOrderId: p.order_id, providerPaymentId: p.id, amountMinor: p.amount, currency: p.currency, method: p.method, raw: minimal });
          }
          break;
        case "payment.authorized":
          await recordPaymentStatus(p.order_id, "AUTHORIZED", p.id);
          break;
        case "payment.failed":
          await recordPaymentStatus(p.order_id, "FAILED");
          break;
      }
    }
    await db.webhookEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
    return Response.json({ ok: true });
  } catch (e) {
    // Forget the event so Razorpay's retry is processed again.
    console.error("razorpay webhook failed", eventId, e);
    await db.webhookEvent.delete({ where: { id: eventId } }).catch(() => {});
    return new Response("Error", { status: 500 });
  }
}
