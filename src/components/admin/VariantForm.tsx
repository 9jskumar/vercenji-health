"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveVariant, type FormState } from "@/lib/actions/catalogue";
import { keepValuesSubmit } from "@/lib/forms";
import { Notice } from "./FormBits";

type V = { id: string; sku: string; name: string; mrpMinor: number; priceMinor: number; stock: number; lowStockAt: number; weightGrams: number | null; allowPreorder: boolean; isActive: boolean };

const rs = (minor: number) => (minor / 100).toFixed(2).replace(/\.00$/, "");

export function VariantForm({ productId, variant }: { productId: string; variant?: V }) {
  const formRef = useRef<HTMLFormElement>(null);
  // True once someone types into this row and has not saved it yet, so we can say plainly that it is not saved.
  const [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveVariant(prev, fd);
    if (res.ok) {
      if (!variant) formRef.current?.reset(); // clear the "add an option" row after it is saved
      setDirty(false);
    }
    return res;
  }, {});
  // Warn before leaving the page with an option that was typed but never saved.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const cell = "flex flex-col gap-1 text-xs font-semibold";
  return (
    <form ref={formRef} onSubmit={keepValuesSubmit(action)} onInput={() => setDirty(true)} data-unsaved-option={dirty ? "" : undefined}
      className={`flex flex-col gap-2 rounded-xl bg-ivory p-4 ${dirty ? "ring-2 ring-[#C9A24A]" : ""}`}>
      <input type="hidden" name="productId" value={productId} />
      {variant && <input type="hidden" name="variantId" value={variant.id} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <label className={`${cell} col-span-2`}>Option name<input name="name" required maxLength={120} defaultValue={variant?.name} placeholder="60 capsules" className="field py-2 text-sm font-normal" /></label>
        <label className={cell}>SKU<input name="sku" required maxLength={60} defaultValue={variant?.sku} className="field py-2 text-sm font-normal uppercase" /></label>
        <label className={cell}>MRP (₹)<input name="mrp" required inputMode="decimal" defaultValue={variant ? rs(variant.mrpMinor) : ""} className="field py-2 text-sm font-normal" /></label>
        <label className={cell}>Price (₹)<input name="price" required inputMode="decimal" defaultValue={variant ? rs(variant.priceMinor) : ""} className="field py-2 text-sm font-normal" /></label>
        <label className={cell}>Stock<input name="stock" required type="number" min={0} defaultValue={variant?.stock ?? 0} className="field py-2 text-sm font-normal" /></label>
        <label className={cell}>Low-stock alert<input name="lowStockAt" type="number" min={0} defaultValue={variant?.lowStockAt ?? 5} className="field py-2 text-sm font-normal" /></label>
        <label className={cell}>Weight (g)<input name="weightGrams" inputMode="numeric" defaultValue={variant?.weightGrams ?? ""} className="field py-2 text-sm font-normal" /></label>
      </div>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={variant?.isActive ?? true} className="accent-green" />On sale</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="allowPreorder" defaultChecked={variant?.allowPreorder} className="accent-green" />Allow pre-orders when out of stock</label>
        <button type="submit" disabled={pending} className="ml-auto rounded-full bg-green px-5 py-2 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : variant ? "Save option" : "Add option"}</button>
      </div>
      {dirty && !pending && !state.error && (
        <p role="status" className="m-0 rounded-xl bg-[#FBF1DC] p-3 text-sm font-semibold text-[#7A5A1E]">
          Not saved yet. Click {variant ? "Save option" : "Add option"} to save this option. Save product at the bottom of the page does not save options.
        </p>
      )}
      <Notice state={dirty ? { error: state.error } : state} />
    </form>
  );
}
