import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { customerOrderWhere, requireCustomer } from "@/lib/auth/customer";
import { formatMoney, taxNameFor } from "@/lib/money";
import { customerStatus, withinReturnWindow } from "@/content/account";
import { AccountNav } from "@/components/account/AccountNav";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

type Address = { fullName: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; postalCode: string };

async function OrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const customer = await requireCustomer(`/account/orders/${encodeURIComponent(number)}`);
  const order = await db.order.findFirst({
    where: { number, ...customerOrderWhere(customer) },
    include: { items: { orderBy: { id: "asc" } }, events: { orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true } } },
  });
  if (!order) notFound();
  const a = order.shippingAddress as Address;

  // One line per status change; staff notes stay internal.
  const timeline = order.events.filter((e, i, all) => i === 0 || all[i - 1].status !== e.status);
  const deliveredAt = [...order.events].reverse().find((e) => e.status === "DELIVERED")?.createdAt;
  const canReturn = order.status === "DELIVERED" && withinReturnWindow(deliveredAt);

  return (
    <>
      <AccountNav current="/account/orders" />
      <Link href="/account/orders" className="text-sm font-bold text-green underline underline-offset-4">← All orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-serif text-4xl font-normal text-forest">Order {order.number}</h1>
          <span className="text-stone">Placed {order.placedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {(order.courier || order.trackingNumber) && (
        <section className="flex flex-col gap-1 rounded-3xl bg-white p-6 ring-1 ring-line">
          <span className="label">Delivery tracking</span>
          <span>{order.courier}{order.trackingNumber ? ` · Tracking number ${order.trackingNumber}` : ""}</span>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-7 ring-1 ring-line">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span>{i.productName} <span className="text-stone">· {i.variantName} × {i.quantity}</span></span>
              <span>{formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotalMinor, order.currency)}</span></div>
          {order.discountMinor > 0 && <div className="flex justify-between"><span>Discount</span><span>−{formatMoney(order.discountMinor, order.currency)}</span></div>}
          <div className="flex justify-between"><span>Delivery</span><span>{order.shippingMinor ? formatMoney(order.shippingMinor, order.currency) : "No charge"}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatMoney(order.totalMinor, order.currency)}</span></div>
          {order.taxMinor > 0 && <span className="text-sm text-stone">Includes {taxNameFor(order.currency)} of {formatMoney(order.taxMinor, order.currency)}</span>}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="flex flex-col gap-1 rounded-3xl bg-white p-6 ring-1 ring-line">
          <span className="label">Delivering to</span>
          <span>{a.fullName}</span>
          <span className="text-stone">{[a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.postalCode}`].filter(Boolean).join(", ")}</span>
        </section>
        <section className="flex flex-col gap-2 rounded-3xl bg-white p-6 ring-1 ring-line">
          <span className="label">Progress</span>
          <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
            {timeline.map((e, i) => (
              <li key={i} className="flex justify-between gap-4 text-[15px]">
                <span>{customerStatus[e.status].label}</span>
                <span className="text-stone">{e.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        {canReturn && <Link href={`/account/returns?order=${order.number}`} className="btn-primary">Report a problem with this order</Link>}
        <Link href="/help" className="btn-ghost">Get help</Link>
      </div>
    </>
  );
}

export default function OrderPage({ params }: PageProps<"/account/orders/[number]">) {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-stone">Loading your order…</p>}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}
