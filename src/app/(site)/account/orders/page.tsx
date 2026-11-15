import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { customerOrderWhere, requireCustomer } from "@/lib/auth/customer";
import { formatMoney } from "@/lib/money";
import { AccountNav } from "@/components/account/AccountNav";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

async function Orders() {
  const customer = await requireCustomer("/account/orders");
  const orders = await db.order.findMany({
    where: { ...customerOrderWhere(customer), status: { not: "PENDING_PAYMENT" } },
    orderBy: { placedAt: "desc" },
    take: 100,
    select: { number: true, placedAt: true, status: true, totalMinor: true, currency: true, _count: { select: { items: true } } },
  });
  return (
    <>
      <AccountNav current="/account/orders" />
      <h1 className="m-0 font-serif text-4xl font-normal text-forest">My orders</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-8 ring-1 ring-line">
          <p className="m-0">You have no orders with {customer.email} yet.</p>
          <Link href="/nutrition" className="btn-primary">Shop nutrition</Link>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {orders.map((o) => (
            <li key={o.number}>
              <Link href={`/account/orders/${o.number}`} className="card-lift flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl bg-white p-5 text-charcoal no-underline ring-1 ring-line">
                <span className="flex flex-col">
                  <span className="font-semibold">{o.number}</span>
                  <span className="text-sm text-stone">
                    {o.placedAt.toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o._count.items} {o._count.items === 1 ? "item" : "items"}
                  </span>
                </span>
                <StatusBadge status={o.status} />
                <span className="font-semibold">{formatMoney(o.totalMinor, o.currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-7 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-stone">Loading your orders…</p>}>
        <Orders />
      </Suspense>
    </div>
  );
}
