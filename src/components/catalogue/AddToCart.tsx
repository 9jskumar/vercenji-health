"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCart, type CartState } from "@/lib/actions/cart";
import { formatMoney } from "@/lib/money";

type V = { id: string; name: string; priceMinor: number; mrpMinor: number; currency: string; stock: number; allowPreorder: boolean };

export function AddToCart({ variants }: { variants: V[] }) {
  const [variantId, setVariantId] = useState(variants[0].id);
  const [state, action, pending] = useActionState<CartState, FormData>(addToCart, {});
  const v = variants.find((x) => x.id === variantId) ?? variants[0];
  const available = v.allowPreorder || v.stock > 0;
  const max = v.allowPreorder ? 10 : Math.min(10, v.stock);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold">{formatMoney(v.priceMinor, v.currency)}</span>
        {v.mrpMinor > v.priceMinor && <span className="text-stone line-through">MRP {formatMoney(v.mrpMinor, v.currency)}</span>}
        <span className="text-sm text-stone">Inclusive of all taxes</span>
      </div>
      {variants.length > 1 && (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="label mb-2">Choose an option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <label key={x.id} className={`cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold ring-1 ${x.id === variantId ? "bg-green text-white ring-green" : "bg-white ring-line"}`}>
                <input type="radio" name="variantId" value={x.id} checked={x.id === variantId} onChange={() => setVariantId(x.id)} className="sr-only" />
                {x.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {variants.length === 1 && <input type="hidden" name="variantId" value={v.id} />}
      {available ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Quantity
            <select name="quantity" defaultValue="1" key={v.id} className="field w-24 py-3">
              {Array.from({ length: max }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" disabled={pending} className="btn-primary flex-1 disabled:opacity-60">{pending ? "Adding…" : "Add to cart"}</button>
        </div>
      ) : (
        <p className="m-0 rounded-xl bg-[#FBEAEA] p-3 font-semibold text-[#9B2C2C]">Out of stock</p>
      )}
      {v.allowPreorder && v.stock <= 0 && <p className="m-0 text-sm text-stone">Available to pre-order. We will confirm the dispatch date by email.</p>}
      {state.error && <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      {state.ok && (
        <p role="status" className="m-0 text-sm font-semibold text-green">
          Added to your cart. <Link href="/cart" className="underline">View cart</Link>
        </p>
      )}
    </form>
  );
}
