"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/request";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { OrderStatus } from "@/generated/prisma/enums";
import { nextStatuses } from "@/content/order-flow";

export type OrderUpdateState = { ok?: boolean; error?: string };

const schema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(OrderStatus).optional(),
  courier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  note: z.string().trim().max(2000).optional(),
});

/** Moves an order along its fulfilment steps and/or adds a staff note. Payment states are set only by Razorpay. */
export async function updateOrder(_prev: OrderUpdateState, form: FormData): Promise<OrderUpdateState> {
  const staff = await requireStaff(PERMISSIONS.ordersManage);
  const val = (k: string) => (form.get(k) as string | null) || undefined;
  const parsed = schema.safeParse({
    id: val("id"),
    status: val("status"),
    courier: val("courier"),
    trackingNumber: val("trackingNumber"),
    note: val("note"),
  });
  if (!parsed.success) return { error: "Please check the values and try again." };
  const { id, status, courier, trackingNumber, note } = parsed.data;

  const order = await db.order.findUnique({ where: { id }, select: { status: true, courier: true, trackingNumber: true } });
  if (!order) return { error: "This order no longer exists." };
  const changing = status && status !== order.status;
  if (changing && !nextStatuses[order.status].includes(status))
    return { error: "That status change is not allowed from the current status." };
  if (changing && status === "SHIPPED" && !(courier || order.courier))
    return { error: "Enter the courier before marking the order shipped." };
  if (changing && status === "SHIPPED" && !(trackingNumber || order.trackingNumber))
    return { error: "Enter the tracking number before marking the order shipped." };
  const shippingChanged = (courier && courier !== order.courier) || (trackingNumber && trackingNumber !== order.trackingNumber);
  if (!changing && !shippingChanged && !note) return { error: "Nothing to save." };

  const ip = await clientIp();
  try {
    await db.$transaction(async (tx) => {
      if (changing) {
        // Optimistic check: the status must still be what this page showed.
        const moved = await tx.order.updateMany({ where: { id, status: order.status }, data: { status } });
        if (moved.count !== 1) throw new Error("order changed meanwhile");
      }
      if (shippingChanged)
        await tx.order.update({ where: { id }, data: { ...(courier && { courier }), ...(trackingNumber && { trackingNumber }) } });

      let eventNote = note ?? null;
      if (changing && status === "CANCELLED") {
        // Put back any stock this order took.
        const taken = await tx.stockMovement.findMany({ where: { orderId: id, reason: "ORDER_PLACED" } });
        for (const m of taken) {
          await tx.productVariant.update({ where: { id: m.variantId }, data: { stock: { increment: -m.delta } } });
          await tx.stockMovement.create({
            data: { variantId: m.variantId, delta: -m.delta, reason: "ORDER_CANCELLED", orderId: id, actorId: staff.id },
          });
        }
        if (order.status !== "PENDING_PAYMENT")
          eventNote = [eventNote, "Paid order cancelled: issue the refund in the Razorpay dashboard."].filter(Boolean).join(" ");
      }
      if (changing || note) {
        await tx.orderEvent.create({ data: { orderId: id, status: status ?? order.status, note: eventNote, actorId: staff.id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: staff.id,
          action: changing ? "order.status" : shippingChanged ? "order.shipping" : "order.note",
          entityType: "Order",
          entityId: id,
          before: { status: order.status, courier: order.courier, trackingNumber: order.trackingNumber },
          after: {
            status: status ?? order.status,
            courier: courier ?? order.courier,
            trackingNumber: trackingNumber ?? order.trackingNumber,
          },
          ipAddress: ip,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "order changed meanwhile")
      return { error: "Someone else updated this order. Reload the page and try again." };
    throw e;
  }
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}
