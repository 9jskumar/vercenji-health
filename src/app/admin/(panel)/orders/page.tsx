import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { dateTime } from "@/content/admin";
import { orderStatusLabels, orderStatusTone } from "@/content/checkout";
import { formatMoney } from "@/lib/money";
import { OrderStatus } from "@/generated/prisma/enums";

const PAGE_SIZE = 25;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff(PERMISSIONS.ordersManage);
  const sp = await searchParams;
  const status = Object.values(OrderStatus).find((s) => s === sp.status);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...(status && { status }),
    ...(q && { OR: [{ number: { contains: q } }, { guestEmail: { contains: q } }, { guestPhone: { contains: q } }] }),
  };
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, number: true, guestEmail: true, status: true, totalMinor: true, currency: true, placedAt: true, shippingAddress: true, _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (status) u.set("status", status);
    if (q) u.set("q", q);
    u.set("page", String(p));
    return `?${u}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Orders</h1>
        <span className="text-sm text-stone">{total} found</span>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-line" role="search">
        <label className="flex flex-[1_1_220px] flex-col gap-1 text-sm font-semibold">
          Search
          <input name="q" defaultValue={q} placeholder="Order number, email or phone" className="field py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Status
          <select name="status" defaultValue={status ?? ""} className="field py-2">
            <option value="">All statuses</option>
            {Object.values(OrderStatus).map((s) => <option key={s} value={s}>{orderStatusLabels[s]}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary py-2.5">Filter</button>
        {(status || q) && <Link href="/admin/orders" className="py-2.5 text-sm font-semibold text-green underline">Clear</Link>}
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-ivory text-xs tracking-wide text-stone uppercase">
            <tr>
              <th className="p-3">Placed</th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const a = r.shippingAddress as { fullName?: string; city?: string };
              return (
                <tr key={r.id} className="border-t border-line hover:bg-ivory/60">
                  <td className="p-3 whitespace-nowrap text-stone">{dateTime(r.placedAt)}</td>
                  <td className="p-3 font-mono"><Link href={`/admin/orders/${r.id}`} className="font-semibold text-green underline">{r.number}</Link></td>
                  <td className="p-3">{a.fullName}<span className="block text-stone">{r.guestEmail} · {a.city}</span></td>
                  <td className="p-3">{r._count.items}</td>
                  <td className="p-3 whitespace-nowrap">{formatMoney(r.totalMinor, r.currency)}</td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${orderStatusTone[r.status]}`}>{orderStatusLabels[r.status]}</span></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-stone">No orders match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
          {page > 1 && <Link href={qs(page - 1)} className="font-semibold text-green underline">Previous</Link>}
          <span className="text-stone">Page {page} of {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="font-semibold text-green underline">Next</Link>}
        </nav>
      )}
    </div>
  );
}
