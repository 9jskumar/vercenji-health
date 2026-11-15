"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCustomer, customerOrderWhere } from "@/lib/auth/customer";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { sendMail } from "@/lib/mail";
import { company } from "@/lib/site";
import { returnReasons, withinReturnWindow } from "@/content/account";

export type ReturnState = { error?: string };

const schema = z.object({
  order: z.string().trim().min(1).max(40),
  reason: z.enum(Object.keys(returnReasons) as [keyof typeof returnReasons]),
  details: z.string().trim().min(10, "Please tell us a little more (at least 10 characters).").max(1000),
});

/** Records a return request on a delivered order, within 24 hours of delivery (Shipping and refunds policy). */
export async function requestReturn(_prev: ReturnState, form: FormData): Promise<ReturnState> {
  const customer = await getCustomer();
  if (!customer) return { error: "Your session has ended. Please sign in again." };
  if (!rateLimit(`return:${customer.id}`, 10, 60 * 60 * 1000) || !rateLimit(`return:ip:${await clientIp()}`, 20, 60 * 60 * 1000)) {
    return { error: "Too many requests. Please try again later." };
  }
  const parsed = schema.safeParse({ order: form.get("order"), reason: form.get("reason"), details: form.get("details") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { order: number, reason, details } = parsed.data;

  const order = await db.order.findFirst({
    where: { number, ...customerOrderWhere(customer) },
    select: { id: true, number: true, status: true, events: { where: { status: "DELIVERED" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return { error: "We could not find that order on your account." };
  const deliveredAt = order.events[0]?.createdAt;
  if (order.status !== "DELIVERED" || !deliveredAt) return { error: "Returns can be requested once an order is marked delivered." };
  if (!withinReturnWindow(deliveredAt)) {
    return { error: `The 24-hour window for this order has passed. Please contact ${company.supportEmail} or ${company.supportPhone}.` };
  }

  const note = `Return requested by the customer. Reason: ${returnReasons[reason]}. Details: ${details}`;
  const done = await db.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({ where: { id: order.id, status: "DELIVERED" }, data: { status: "RETURN_REQUESTED" } });
    if (moved.count !== 1) return false;
    await tx.orderEvent.create({ data: { orderId: order.id, status: "RETURN_REQUESTED", note, actorId: customer.id } });
    await tx.auditLog.create({ data: { actorId: customer.id, action: "order.return_requested", entityType: "Order", entityId: order.id, after: { reason } } });
    return true;
  });
  if (!done) return { error: "This order changed in the meantime. Please refresh the page." };

  // Let the support team know. The request is saved even if this email cannot be sent.
  await sendMail({
    to: company.supportEmail,
    subject: `Return requested: ${order.number}`,
    text: `${customer.email} requested a return for order ${order.number}.\n\n${note}\n\nOpen the order in the admin: ${process.env.SITE_URL ?? ""}/admin/orders/${order.id}`,
  });

  redirect(`/account/returns?requested=${encodeURIComponent(order.number)}`);
}
