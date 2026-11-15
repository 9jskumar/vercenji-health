"use client";

import { useActionState } from "react";
import { keepValuesSubmit } from "@/lib/forms";
import { updateCustomerName } from "@/lib/actions/customer-auth";

export function NameForm({ name }: { name: string | null }) {
  const [state, action, pending] = useActionState(updateCustomerName, {});
  return (
    <form onSubmit={keepValuesSubmit(action)} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-[1_1_240px] flex-col gap-1.5">
        <label htmlFor="name" className="label">Your name</label>
        <input id="name" name="name" defaultValue={name ?? ""} maxLength={120} autoComplete="name" className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn-ghost disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
      {state.ok && <p role="status" className="m-0 w-full text-sm font-semibold text-green">Saved.</p>}
      {state.error && <p role="alert" className="m-0 w-full text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
    </form>
  );
}
