import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { recordCapturedPayment } from "@/lib/orders";
import { paymentIntentId, retrieveCheckoutSession } from "@/lib/stripe";

// Stripe sends the customer here after paying. The session is read back from Stripe's API (the
// browser's word is never trusted), the order is confirmed if paid, and the cart is emptied.
// The webhook confirms the order independently, so nothing is lost if this request never arrives.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const done = new URL("/checkout/complete", url);
  const sessionId = url.searchParams.get("session_id") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return NextResponse.redirect(done, 303);

  const payment = await db.payment.findUnique({ where: { providerOrderId: sessionId }, select: { id: true } });
  if (payment) {
    try {
      const s = await retrieveCheckoutSession(sessionId);
      if (s.payment_status === "paid" && s.amount_total !== null && s.currency) {
        await recordCapturedPayment({ providerOrderId: s.id, providerPaymentId: paymentIntentId(s), amountMinor: s.amount_total, currency: s.currency.toUpperCase(), method: "stripe" });
      }
    } catch (e) {
      // Stripe unreachable: the webhook will confirm the order when it arrives.
      console.error("stripe session lookup failed", e);
    }
    const cart = await getCart();
    if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return NextResponse.redirect(done, 303);
}
