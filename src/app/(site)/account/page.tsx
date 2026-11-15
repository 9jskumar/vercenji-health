import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { customerOrderWhere, requireCustomer } from "@/lib/auth/customer";
import { formatMoney } from "@/lib/money";
import { AccountNav } from "@/components/account/AccountNav";
import { NameForm } from "@/components/account/NameForm";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

async function Overview() {
  const customer = await requireCustomer("/account");
  const recent = await db.order.findMany({
    where: { ...customerOrderWhere(customer), status: { not: "PENDING_PAYMENT" } },
    orderBy: { placedAt: "desc" },
    take: 3,
    select: { number: true, placedAt: true, status: true, totalMinor: true, currency: true },
  });
  return (
    <>
      <AccountNav current="/account" />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Hello{customer.name ? `, ${customer.name}` : ""}</h1>
        <p className="m-0 text-stone">Signed in as {customer.email}</p>
      </div>
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-7 ring-1 ring-line">
        <div className="flex items-center justify-between gap-4">
          <h2 className="m-0 font-serif text-2xl font-normal text-forest">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-bold text-green underline underline-offset-4">All orders</Link>
        </div>
        {recent.length === 0 ? (
          <p className="m-0 text-stone">
            No orders yet. Orders placed with {customer.email} appear here, including ones placed before you signed in.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {recent.map((o) => (
              <li key={o.number}>
                <Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-charcoal no-underline hover:text-green">
                  <span className="font-semibold">{o.number}</span>
                  <span className="text-sm text-stone">{o.placedAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  <StatusBadge status={o.status} />
                  <span className="font-semibold">{formatMoney(o.totalMinor, o.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-7 ring-1 ring-line">
        <h2 className="m-0 font-serif text-2xl font-normal text-forest">Your details</h2>
        <NameForm name={customer.name} />
        <p className="m-0 text-sm text-stone">
          To change your email address or close your account, contact us through the <Link href="/help" className="text-green">Help page</Link>.
        </p>
      </section>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-7 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-stone">Loading your account…</p>}>
        <Overview />
      </Suspense>
    </div>
  );
}
