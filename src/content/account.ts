import type { OrderStatus } from "@/generated/prisma/enums";

/** What customers see for each order status. Staff notes are never shown to customers. */
export const customerStatus: Record<OrderStatus, { label: string; tone: "wait" | "ok" | "done" | "stop" }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", tone: "wait" },
  PAID: { label: "Confirmed", tone: "ok" },
  PROCESSING: { label: "Being packed", tone: "ok" },
  SHIPPED: { label: "Shipped", tone: "ok" },
  DELIVERED: { label: "Delivered", tone: "done" },
  CANCELLED: { label: "Cancelled", tone: "stop" },
  RETURN_REQUESTED: { label: "Return requested", tone: "wait" },
  RETURNED: { label: "Returned", tone: "done" },
  REFUNDED: { label: "Refunded", tone: "done" },
};

/** Returns follow the Shipping and refunds policy: wrong or damaged deliveries, reported within 24 hours. */
export const RETURN_WINDOW_MS = 24 * 60 * 60 * 1000;

/** True while a delivered order can still be reported online. */
export const withinReturnWindow = (deliveredAt: Date | undefined) => !!deliveredAt && Date.now() - deliveredAt.getTime() < RETURN_WINDOW_MS;

export const returnReasons = {
  WRONG_ITEM: "I received the wrong item",
  DAMAGED: "The item arrived damaged",
} as const;
export type ReturnReason = keyof typeof returnReasons;
