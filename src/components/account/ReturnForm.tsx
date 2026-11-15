"use client";

import { useActionState } from "react";
import { keepValuesSubmit } from "@/lib/forms";
import { requestReturn, type ReturnState } from "@/lib/actions/returns";
import { returnReasons } from "@/content/account";

export function ReturnForm({ orders, preselected }: { orders: { number: string; label: string }[]; preselected?: string }) {
  const [state, action, pending] = useActionState<ReturnState, FormData>(requestReturn, {});
  return (
    <form onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="order" className="label">Order</label>
        <select id="order" name="order" required defaultValue={preselected ?? orders[0]?.number} className="field">
          {orders.map((o) => (
            <option key={o.number} value={o.number}>{o.label}</option>
          ))}
        </select>
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="label mb-1.5">What went wrong?</legend>
        {Object.entries(returnReasons).map(([key, label], i) => (
          <label key={key} className="flex items-center gap-2.5">
            <input type="radio" name="reason" value={key} required defaultChecked={i === 0} />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="details" className="label">Details</label>
        <textarea id="details" name="details" required minLength={10} maxLength={1000} rows={4} className="field" placeholder="Which item, and what is wrong with it?" />
      </div>
      {state.error && <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start py-3 disabled:opacity-60">{pending ? "Sending…" : "Send return request"}</button>
    </form>
  );
}
