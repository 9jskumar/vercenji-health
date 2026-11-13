"use client";

import { useActionState, useRef } from "react";
import { updateOrder, type OrderUpdateState } from "@/lib/actions/orders";
import { orderStatusLabels } from "@/content/checkout";
import type { OrderStatus } from "@/generated/prisma/enums";

type Props = { id: string; status: OrderStatus; next: OrderStatus[]; courier: string | null; trackingNumber: string | null };

export function OrderStatusForm({ id, status, next, courier, trackingNumber }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<OrderUpdateState, FormData>(async (prev, fd) => {
    const res = await updateOrder(prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  }, {});
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3" key={status}>
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Status
        <select name="status" defaultValue={status} className="field" disabled={next.length === 0}>
          <option value={status}>{orderStatusLabels[status]} (current)</option>
          {next.map((s) => <option key={s} value={s}>{orderStatusLabels[s]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Courier
        <input name="courier" defaultValue={courier ?? ""} maxLength={60} className="field font-normal" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Tracking number
        <input name="trackingNumber" defaultValue={trackingNumber ?? ""} maxLength={60} className="field font-normal" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Note
        <textarea name="note" rows={3} maxLength={2000} placeholder="Visible to staff only" className="field font-normal" />
      </label>
      {state.error && <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      {state.ok && <p role="status" className="m-0 text-sm font-semibold text-green">Saved.</p>}
      <button type="submit" disabled={pending} className="btn-primary py-3 disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
