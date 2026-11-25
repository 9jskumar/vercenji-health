import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMarket } from "@/lib/market";
import { cartLines, getCart } from "@/lib/cart";
import { priceLines } from "@/lib/orders";
import { checkoutAvailable, isTestMode } from "@/lib/razorpay";
import { stripeTestMode } from "@/lib/stripe";
import { formatMoney } from "@/lib/money";
import { UaeSeller } from "@/components/checkout/UaeSeller";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function Checkout({ searchParams }: { searchParams: PageProps<"/checkout">["searchParams"] }) {
  await connection();
  const cart = await getCart();
  const market = await getMarket();
  const lines = cart ? cartLines(cart, market.currency) : [];
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-10 ring-1 ring-line">
        <p className="m-0 text-lg">Your cart is empty.</p>
        <Link href="/nutrition" className="btn-primary">Explore products</Link>
      </div>
    );
  }
  const problems = lines.filter((l) => l.problem);
  if (problems.length > 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-10 ring-1 ring-line">
        <p className="m-0 text-lg">Some items in your cart need attention before you can check out.</p>
        <Link href="/cart" className="btn-primary">Review your cart</Link>
      </div>
    );
  }
  const currency = market.currency;
  const totals = priceLines(lines, currency);
  // The UAE store is only reachable once Stripe is set up (and, in test mode, only by staff).
  const uae = market.code === "AE";
  const enabled = uae ? true : await checkoutAvailable();
  const testMode = uae ? stripeTestMode() : isTestMode();
  const cancelled = (await searchParams).payment === "cancelled";

  return (
    <div className="flex flex-wrap gap-8">
      <div className="flex flex-[2_1_520px] flex-col gap-6">
        {!enabled && (
          <p role="status" className="m-0 rounded-2xl bg-[#FBF1DC] p-4 text-[15px] text-[#7A5A1E]">
            Online payment is not switched on yet, so orders cannot be placed. Please check back soon.
          </p>
        )}
        {enabled && testMode && (
          <p role="status" className="m-0 rounded-2xl bg-[#FBF1DC] p-4 text-[15px] text-[#7A5A1E]">
            Test mode (visible to signed-in staff only): payments use {uae ? "Stripe" : "Razorpay"} test cards and no money is taken.
          </p>
        )}
        {cancelled && (
          <p role="alert" className="m-0 rounded-2xl bg-[#FBEAEA] p-4 text-[15px] text-[#9B2C2C]">
            The payment was cancelled and nothing was charged. You can try again below.
          </p>
        )}
        <CheckoutForm enabled={enabled} market={market.code} />
      </div>
      <aside className="flex flex-[1_1_300px] flex-col gap-4 self-start rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 font-serif text-2xl font-normal text-forest">Order summary</h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {lines.map(({ item, variant, product, lineMinor }) => (
            <li key={item.id} className="flex justify-between gap-4 text-[15px]">
              <span>
                {product.name} <span className="text-stone">· {variant.name} × {item.quantity}</span>
              </span>
              <span className="shrink-0">{formatMoney(lineMinor, currency)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(totals.subtotalMinor, currency)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{totals.shippingMinor ? formatMoney(totals.shippingMinor, currency) : "No charge"}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatMoney(totals.totalMinor, currency)}</span></div>
          {totals.taxMinor > 0 && <p className="m-0 text-sm text-stone">Includes {market.taxName} of {formatMoney(totals.taxMinor, currency)}.</p>}
          {uae && <UaeSeller />}
        </div>
        <Link href="/cart" className="text-sm font-semibold text-green underline">Edit cart</Link>
      </aside>
    </div>
  );
}

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 pt-10 pb-[88px]">
      <h1 className="m-0 font-serif text-5xl font-normal text-forest">Checkout</h1>
      <Suspense fallback={<p className="text-stone">Loading checkout…</p>}>
        <Checkout searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
