import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { dateTime } from "@/content/admin";
import { orderStatusLabels, orderStatusTone } from "@/content/checkout";
import { nextStatuses } from "@/content/order-flow";
import { formatMoney } from "@/lib/money";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

type Address = { fullName: string; phone: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; postalCode: string };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireStaff(PERMISSIONS.ordersManage);
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();
  const actorIds = [...new Set(order.events.map((e) => e.actorId).filter((x): x is string => !!x))];
  const actors = actorIds.length ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } }) : [];
  const who = (id: string | null) => (id ? (actors.find((a) => a.id === id)?.name ?? actors.find((a) => a.id === id)?.email ?? "Staff") : "System");
  const a = order.shippingAddress as Address;
  const m = (v: number) => formatMoney(v, order.currency);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="text-sm font-semibold text-green underline">← All orders</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="m-0 font-mono text-3xl text-forest">{order.number}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${orderStatusTone[order.status]}`}>{orderStatusLabels[order.status]}</span>
        <span className="text-sm text-stone">Placed {dateTime(order.placedAt)}</span>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex flex-[2_1_520px] flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-4 text-lg font-bold">Items</h2>
            <table className="w-full border-collapse text-left text-sm">
              <thead className="text-xs text-stone uppercase"><tr><th className="pb-2">Product</th><th className="pb-2">SKU</th><th className="pb-2">Qty</th><th className="pb-2 text-right">Amount</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-t border-line">
                    <td className="py-2">{i.productName}<span className="block text-stone">{i.variantName}</span></td>
                    <td className="py-2 font-mono">{i.sku}</td>
                    <td className="py-2">{i.quantity} × {m(i.unitPriceMinor)}</td>
                    <td className="py-2 text-right">{m(i.unitPriceMinor * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="m-0 mt-4 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-t border-line pt-4 text-sm">
              <dt>Subtotal</dt><dd className="m-0 text-right">{m(order.subtotalMinor)}</dd>
              <dt>Delivery</dt><dd className="m-0 text-right">{m(order.shippingMinor)}</dd>
              <dt className="font-bold">Total</dt><dd className="m-0 text-right font-bold">{m(order.totalMinor)}</dd>
              <dt className="text-stone">GST included</dt><dd className="m-0 text-right text-stone">{m(order.taxMinor)}</dd>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-4 text-lg font-bold">Payments</h2>
            {order.payments.length === 0 && <p className="m-0 text-stone">No payment started.</p>}
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {order.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-3">
                  <span className="font-mono">{p.providerPaymentId ?? p.providerOrderId}</span>
                  <span>{p.status.toLowerCase()}{p.method ? ` · ${p.method}` : ""}</span>
                  <span>{formatMoney(p.amountMinor, p.currency)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-4 text-lg font-bold">History</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="border-l-2 border-line pl-3">
                  <span className="font-semibold">{orderStatusLabels[e.status]}</span>
                  <span className="text-stone"> · {dateTime(e.createdAt)} · {who(e.actorId)}</span>
                  {e.note && <p className="m-0 mt-1 whitespace-pre-wrap">{e.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-6 self-start">
          <section className="flex flex-col gap-1 rounded-2xl bg-white p-6 text-sm ring-1 ring-line">
            <h2 className="m-0 mb-3 text-lg font-bold">Customer</h2>
            <span>{order.guestEmail}</span>
            <span>{order.guestPhone}</span>
            {order.gstinForInvoice && <span>GSTIN {order.gstinForInvoice}</span>}
            <h3 className="m-0 mt-4 mb-1 text-sm font-bold">Deliver to</h3>
            <span>{a.fullName} · {a.phone}</span>
            <span>{a.line1}</span>
            {a.line2 && <span>{a.line2}</span>}
            {a.landmark && <span>Near {a.landmark}</span>}
            <span>{a.city}, {a.state} {a.postalCode}</span>
            {order.notes && <><h3 className="m-0 mt-4 mb-1 text-sm font-bold">Customer notes</h3><p className="m-0 whitespace-pre-wrap">{order.notes}</p></>}
          </section>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-4 text-lg font-bold">Update</h2>
            <OrderStatusForm id={order.id} status={order.status} next={nextStatuses[order.status]} courier={order.courier} trackingNumber={order.trackingNumber} />
          </section>
        </aside>
      </div>
    </div>
  );
}
