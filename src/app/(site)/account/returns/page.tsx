import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { customerOrderWhere, requireCustomer } from "@/lib/auth/customer";
import { company } from "@/lib/site";
import { withinReturnWindow } from "@/content/account";
import { AccountNav } from "@/components/account/AccountNav";
import { ReturnForm } from "@/components/account/ReturnForm";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = { title: "Returns", robots: { index: false } };

async function Returns({ searchParams }: { searchParams: Promise<{ order?: string | string[]; requested?: string | string[] }> }) {
  const customer = await requireCustomer("/account/returns");
  const { order: wanted, requested: justRequested } = await searchParams;
  const orders = await db.order.findMany({
    where: { ...customerOrderWhere(customer), status: { in: ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] } },
    orderBy: { placedAt: "desc" },
    take: 50,
    select: {
      number: true,
      status: true,
      events: { where: { status: "DELIVERED" }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });
  const eligible = orders.filter((o) => o.status === "DELIVERED" && withinReturnWindow(o.events[0]?.createdAt));
  const requested = orders.filter((o) => o.status === "RETURN_REQUESTED" || o.status === "RETURNED");

  return (
    <>
      <AccountNav current="/account/returns" />
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Returns</h1>
        <p className="m-0 max-w-[680px] leading-relaxed text-stone">
          If an item arrives damaged or is not what you ordered, tell us within 24 hours of delivery and we will replace it or
          refund you. For safety and hygiene, supplements can only be returned unopened with the seal intact. Read the full{" "}
          <Link href="/legal/shipping-refunds" className="text-green">Shipping and refunds policy</Link>.
        </p>
      </div>

      {typeof justRequested === "string" && requested.some((o) => o.number === justRequested && o.status === "RETURN_REQUESTED") && (
        <p role="status" className="m-0 rounded-2xl bg-[#E6EFE7] p-5 leading-relaxed font-semibold text-green">
          Your return request for {justRequested} is in. Please email photos of the item and packaging to {company.supportEmail} with
          your order number, so we can sort it out quickly.
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-7 ring-1 ring-line">
        <h2 className="m-0 font-serif text-2xl font-normal text-forest">Report a problem</h2>
        {eligible.length === 0 ? (
          <p className="m-0 text-stone">
            None of your orders can be returned online right now: requests open when an order is delivered and stay open for 24
            hours. For anything else, contact {company.supportEmail} or {company.supportPhone}.
          </p>
        ) : (
          <ReturnForm
            orders={eligible.map((o) => ({ number: o.number, label: `${o.number} · delivered ${o.events[0].createdAt.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })}` }))}
            preselected={typeof wanted === "string" && eligible.some((o) => o.number === wanted) ? wanted : undefined}
          />
        )}
      </section>

      {requested.length > 0 && (
        <section className="flex flex-col gap-3 rounded-3xl bg-white p-7 ring-1 ring-line">
          <h2 className="m-0 font-serif text-2xl font-normal text-forest">Your return requests</h2>
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {requested.map((o) => (
              <li key={o.number} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/account/orders/${o.number}`} className="font-semibold text-charcoal">{o.number}</Link>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function ReturnsPage({ searchParams }: PageProps<"/account/returns">) {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-7 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-stone">Loading…</p>}>
        <Returns searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
