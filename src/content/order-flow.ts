import type { OrderStatus } from "@/generated/prisma/enums";

/** Status changes staff may make. PAID and REFUNDED are set only by verified payment events. */
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  RETURNED: [],
  CANCELLED: [],
  REFUNDED: [],
};
