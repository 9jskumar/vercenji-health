import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { cartLines, getCart, MAX_QTY } from "@/lib/cart";
import { setCartQuantity } from "@/lib/actions/cart";
import { mediaUrl } from "@/lib/catalogue";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

const productHref = (vertical: string, slug: string) => `/${vertical === "LIFESTYLE" ? "lifestyle" : "nutrition"}/${slug}`;

async function CartContents() {
  await connection();
  const cart = await getCart();
  const lines = cart ? cartLines(cart) : [];
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-10 ring-1 ring-line">
        <p className="m-0 text-lg">Your cart is empty.</p>
        <Link href="/nutrition" className="btn-primary">Explore products</Link>
      </div>
    );
  }
  const sellable = lines.filter((l) => !l.problem);
  const subtotal = sellable.reduce((s, l) => s + l.lineMinor, 0);
  const currency = lines[0].variant.currency;

  return (
    <div className="flex flex-wrap gap-8">
      <ul className="m-0 flex flex-[2_1_520px] list-none flex-col gap-4 p-0">
        {lines.map(({ item, variant, product, lineMinor, problem }) => (
          <li key={item.id} className="flex flex-wrap gap-4 rounded-3xl bg-white p-4 ring-1 ring-line">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-ivory">
              {product.images[0] && <Image src={mediaUrl(product.images[0].path)} alt={product.images[0].alt} fill sizes="96px" className="object-cover" unoptimized />}
            </div>
            <div className="flex min-w-[180px] flex-1 flex-col gap-1">
              <Link href={productHref(product.vertical, product.slug)} className="font-serif text-xl text-forest">{product.name}</Link>
              <span className="text-sm text-stone">{variant.name}</span>
              <span className="text-sm">{formatMoney(variant.priceMinor, variant.currency)} each</span>
              {problem && <span className="text-sm font-semibold text-[#9B2C2C]">{problem}</span>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-bold">{formatMoney(lineMinor, variant.currency)}</span>
              <form action={setCartQuantity} className="flex items-center gap-2">
                <input type="hidden" name="itemId" value={item.id} />
                <label className="sr-only" htmlFor={`q-${item.id}`}>Quantity for {product.name}</label>
                <select id={`q-${item.id}`} name="quantity" defaultValue={String(Math.min(item.quantity, MAX_QTY))} className="field w-20 py-2">
                  {Array.from({ length: MAX_QTY }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <button type="submit" className="text-sm font-semibold text-green underline">Update</button>
              </form>
              <form action={setCartQuantity}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="quantity" value="0" />
                <button type="submit" className="text-sm text-stone underline">Remove</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <aside className="flex flex-[1_1_280px] flex-col gap-4 self-start rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 font-serif text-2xl font-normal text-forest">Order summary</h2>
        <div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(subtotal, currency)}</strong></div>
        <p className="m-0 text-sm text-stone">Prices include GST. Delivery is calculated at checkout.</p>
        <Link href="/checkout" aria-disabled={sellable.length === 0} className={`btn-primary ${sellable.length === 0 ? "pointer-events-none opacity-50" : ""}`}>Checkout</Link>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 pt-10 pb-[88px]">
      <h1 className="m-0 font-serif text-5xl font-normal text-forest">Your cart</h1>
      <Suspense fallback={<p className="text-stone">Loading your cart…</p>}>
        <CartContents />
      </Suspense>
    </div>
  );
}
