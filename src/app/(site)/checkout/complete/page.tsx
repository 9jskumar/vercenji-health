import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { ORDER_COOKIE } from "@/lib/orders";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

type Address = { fullName: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; postalCode: string };

async function Confirmation() {
  await connection();
  // Only the browser that placed the order can see it here.
  const id = (await cookies()).get(ORDER_COOKIE)?.value;
  const order = id ? await db.order.findUnique({ where: { id }, include: { items: { orderBy: { id: "asc" } } } }) : null;
  if (!order) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-10 ring-1 ring-line">
        <p className="m-0 text-lg">We could not find a recent order from this browser.</p>
        <Link href="/" className="btn-primary">Back to home</Link>
      </div>
    );
  }
  const a = order.shippingAddress as Address;
  const paid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-8 ring-1 ring-line">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Order {order.number}</span>
        <h2 className="m-0 font-serif text-3xl font-normal text-forest">
          {paid ? "Thank you, your order is confirmed" : order.status === "CANCELLED" ? "This order was cancelled" : "We are confirming your payment"}
        </h2>
        {!paid && order.status !== "CANCELLED" && (
          <p className="m-0 text-stone">This usually takes less than a minute. Refresh this page to check again. You will not be charged twice.</p>
        )}
        {paid && <p className="m-0 text-stone">Please keep your order number for any questions about this order.</p>}
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4">
            <span>{i.productName} <span className="text-stone">· {i.variantName} × {i.quantity}</span></span>
            <span>{formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1 border-t border-line pt-4">
        <div className="flex justify-between"><span>Delivery</span><span>{order.shippingMinor ? formatMoney(order.shippingMinor, order.currency) : "No charge"}</span></div>
        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatMoney(order.totalMinor, order.currency)}</span></div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="label">Delivering to</span>
        <span>{a.fullName}</span>
        <span className="text-stone">{[a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.postalCode}`].filter(Boolean).join(", ")}</span>
      </div>
      <Link href="/nutrition" className="btn-ghost self-start">Continue shopping</Link>
    </div>
  );
}

export default function CompletePage() {
  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-6 pt-10 pb-[88px]">
      <h1 className="m-0 font-serif text-5xl font-normal text-forest">Your order</h1>
      <Suspense fallback={<p className="text-stone">Loading your order…</p>}>
        <Confirmation />
      </Suspense>
    </div>
  );
}
