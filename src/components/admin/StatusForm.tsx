"use client";

import { useActionState, useRef } from "react";
import { updateApplication, type UpdateState } from "@/lib/actions/applications";
import { statusLabels } from "@/content/admin";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export function StatusForm({ id, status }: { id: string; status: ApplicationStatus }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<UpdateState, FormData>(async (prev, fd) => {
    const res = await updateApplication(prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  }, {});
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Status
        <select name="status" defaultValue={status} key={status} className="field">
          {(Object.keys(statusLabels) as ApplicationStatus[]).map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Internal note
        <textarea name="note" rows={4} maxLength={4000} placeholder="Visible to staff only" className="field font-normal" />
      </label>
      {state.error && <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      {state.ok && <p role="status" className="m-0 text-sm font-semibold text-green">Saved.</p>}
      <button type="submit" disabled={pending} className="btn-primary py-3 disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
