"use client";

import { useActionState, useState } from "react";
import { jobAction, type AdminFormState } from "@/lib/actions/careers-admin";

type Op = "publish" | "pause" | "close" | "duplicate" | "delete";

const labels: Record<Op, string> = {
  publish: "Publish",
  pause: "Pause (hide temporarily)",
  close: "Close vacancy",
  duplicate: "Duplicate",
  delete: "Delete",
};

/** Status buttons for one vacancy. Delete asks for a second click. */
export function JobActions({ id, status, applications }: { id: string; status: string; applications: number }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(jobAction, {});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ops: Op[] = [
    ...(status !== "PUBLISHED" ? (["publish"] as Op[]) : []),
    ...(status === "PUBLISHED" ? (["pause"] as Op[]) : []),
    ...(status !== "CLOSED" && status !== "DRAFT" ? (["close"] as Op[]) : []),
    "duplicate",
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ops.map((op) => (
          <form key={op} action={action}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" name="op" value={op} disabled={pending} className={`${op === "publish" ? "btn-primary" : "btn-ghost"} px-4 py-2 text-sm disabled:opacity-60`}>
              {status === "CLOSED" && op === "publish" ? "Reopen and publish" : labels[op]}
            </button>
          </form>
        ))}
        {applications === 0 &&
          (confirmDelete ? (
            <form action={action} className="flex items-center gap-2">
              <input type="hidden" name="id" value={id} />
              <button type="submit" name="op" value="delete" disabled={pending} className="btn bg-[#9B2C2C] px-4 py-2 text-sm text-white hover:bg-[#7d2323]">
                Yes, delete permanently
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm font-semibold text-green underline">Cancel</button>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn border-[1.5px] border-[#9B2C2C] px-4 py-2 text-sm text-[#9B2C2C]">
              Delete
            </button>
          ))}
      </div>
      {applications > 0 && <p className="m-0 text-xs text-stone">Vacancies with applications cannot be deleted. Close them instead.</p>}
      {state.error && <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      {state.ok && state.message && <p role="status" className="m-0 text-sm font-semibold text-green">{state.message}</p>}
    </div>
  );
}
