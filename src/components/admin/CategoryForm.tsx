"use client";

import { useActionState } from "react";
import { createCategory, type FormState } from "@/lib/actions/catalogue";
import { Notice } from "./FormBits";

export function CategoryForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCategory, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <label className="flex flex-col gap-1 text-sm font-semibold">Vertical
        <select name="vertical" className="field py-2"><option value="NUTRITION">Nutrition</option><option value="LIFESTYLE">Lifestyle</option><option value="EMS">EMS equipment</option></select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">Name<input name="name" required className="field py-2 font-normal" placeholder="Gut health" /></label>
      <label className="flex flex-col gap-1 text-sm font-semibold">Web address<input name="slug" required className="field py-2 font-normal" placeholder="gut-health" /></label>
      <label className="flex w-24 flex-col gap-1 text-sm font-semibold">Order<input name="sortOrder" type="number" min={0} defaultValue={0} className="field py-2 font-normal" /></label>
      <button type="submit" disabled={pending} className="btn-primary py-2.5 disabled:opacity-60">Add category</button>
      <div className="w-full"><Notice state={state} /></div>
    </form>
  );
}
