"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { keepValuesSubmit } from "@/lib/forms";
import { formatMoney } from "@/lib/money";
import { confirmPayment, placeOrder, type CheckoutState } from "@/lib/actions/checkout";
import { indianStates } from "@/content/checkout";

type Pay = NonNullable<CheckoutState["pay"]>;
type SuccessResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void };
declare global {
  interface Window {
    Razorpay?: new (options: object) => RazorpayInstance;
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const s = existing ?? document.createElement("script");
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("checkout script failed")));
    if (!existing) {
      s.src = SCRIPT;
      s.async = true;
      document.body.appendChild(s);
    }
  });
}

type Phase = "form" | "paying" | "dismissed" | "confirming" | "failed";

export function CheckoutForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [message, setMessage] = useState<string | null>(null);

  function openPayment(pay: Pay) {
    setPhase("paying");
    setMessage(null);
    loadCheckout()
      .then(() => {
        const rzp = new window.Razorpay!({
          key: pay.keyId,
          order_id: pay.providerOrderId,
          amount: pay.amountMinor,
          currency: pay.currency,
          name: "Vercenji Health",
          description: `Order ${pay.orderNumber}`,
          prefill: pay.prefill,
          theme: { color: "#234d2c" },
          handler: async (r: SuccessResponse) => {
            setPhase("confirming");
            const res = await confirmPayment({ providerOrderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
            if (res.ok) {
              router.push("/checkout/complete");
              router.refresh(); // updates the cart count in the header
            }
            else {
              setPhase("failed");
              setMessage(res.error ?? "We could not confirm the payment.");
            }
          },
          modal: { ondismiss: () => setPhase((p) => (p === "paying" ? "dismissed" : p)) },
        });
        rzp.on("payment.failed", (r) => setMessage(r.error?.description ?? "The payment did not go through."));
        rzp.open();
      })
      .catch(() => {
        setPhase("dismissed");
        setMessage("The payment window could not load. Please check your connection and try again.");
      });
  }

  // Open Razorpay's window as soon as the server has created the order.
  const [state, action, pending] = useActionState<CheckoutState, FormData>(async (prev, fd) => {
    const res = await placeOrder(prev, fd);
    if (res.pay) openPayment(res.pay);
    return res;
  }, {});

  const err = (name: string) => state.fieldErrors?.[name];
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, wide = false) => (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}{props.required ? "" : <span className="font-normal text-stone"> (optional)</span>}</span>
      <input name={name} className="field" aria-invalid={!!err(name)} aria-describedby={err(name) ? `${name}-err` : undefined} {...props} />
      {err(name) && <span id={`${name}-err`} className="text-sm font-semibold text-[#9B2C2C]">{err(name)}</span>}
    </label>
  );

  if (state.pay && phase !== "form") {
    const pay = state.pay;
    return (
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 ring-1 ring-line" aria-live="polite">
        <h2 className="m-0 font-serif text-2xl font-normal text-forest">Order {pay.orderNumber}</h2>
        {phase === "paying" && <p className="m-0">Complete the payment of {formatMoney(pay.amountMinor, pay.currency)} in the Razorpay window.</p>}
        {phase === "confirming" && <p className="m-0">Payment received. Confirming your order…</p>}
        {(phase === "dismissed" || phase === "failed") && (
          <>
            <p className="m-0">Your order is saved but not paid yet.</p>
            {message && <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{message}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => openPayment(pay)}>Pay {formatMoney(pay.amountMinor, pay.currency)}</button>
              <Link href="/cart" className="btn-ghost">Back to cart</Link>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={action} onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-8">
      <fieldset className="m-0 grid grid-cols-1 gap-4 rounded-3xl border-0 bg-white p-6 ring-1 ring-line sm:grid-cols-2">
        <legend className="float-left mb-2 w-full font-serif text-2xl text-forest sm:col-span-2">Contact</legend>
        {field("email", "Email", { type: "email", required: true, autoComplete: "email", maxLength: 254 })}
        {field("phone", "Mobile number", { type: "tel", required: true, autoComplete: "tel-national", inputMode: "tel", placeholder: "98765 43210", maxLength: 16 })}
      </fieldset>

      <fieldset className="m-0 grid grid-cols-1 gap-4 rounded-3xl border-0 bg-white p-6 ring-1 ring-line sm:grid-cols-2">
        <legend className="float-left mb-2 w-full font-serif text-2xl text-forest sm:col-span-2">Delivery address</legend>
        <p className="m-0 text-sm text-stone sm:col-span-2">We currently deliver within India.</p>
        {field("fullName", "Recipient's name", { required: true, autoComplete: "name", maxLength: 120 }, true)}
        {field("line1", "House number and street", { required: true, autoComplete: "address-line1", maxLength: 160 }, true)}
        {field("line2", "Area or locality", { autoComplete: "address-line2", maxLength: 160 }, true)}
        {field("landmark", "Landmark", { maxLength: 120 })}
        {field("city", "City", { required: true, autoComplete: "address-level2", maxLength: 80 })}
        <label className="flex flex-col gap-1.5">
          <span className="label">State</span>
          <select name="state" required defaultValue="" className="field" autoComplete="address-level1" aria-invalid={!!err("state")}>
            <option value="" disabled>Choose a state</option>
            {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {err("state") && <span className="text-sm font-semibold text-[#9B2C2C]">{err("state")}</span>}
        </label>
        {field("postalCode", "PIN code", { required: true, autoComplete: "postal-code", inputMode: "numeric", pattern: "[1-9][0-9]{5}", maxLength: 6 })}
        {field("gstin", "GSTIN for a business invoice", { maxLength: 15, autoCapitalize: "characters" })}
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="label">Delivery notes <span className="font-normal text-stone">(optional)</span></span>
          <textarea name="notes" rows={2} maxLength={500} className="field" />
        </label>
      </fieldset>

      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-[15px]">
          <input type="checkbox" name="consentTerms" required className="mt-1 size-4 accent-green" />
          <span>
            I accept the <Link href="/terms" className="text-green underline">terms of sale</Link> and have read the{" "}
            <Link href="/privacy" className="text-green underline">privacy notice</Link>.
          </span>
        </label>
        {err("consentTerms") && <span className="text-sm font-semibold text-[#9B2C2C]">{err("consentTerms")}</span>}
        <label className="flex items-start gap-3 text-[15px]">
          <input type="checkbox" name="marketing" className="mt-1 size-4 accent-green" />
          <span>Send me Vercenji news and offers by email. You can unsubscribe at any time.</span>
        </label>
      </div>

      {state.error && <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      <button type="submit" disabled={!enabled || pending} className="btn-primary self-start disabled:opacity-60">
        {pending ? "Preparing payment…" : "Continue to payment"}
      </button>
      <p className="m-0 text-sm text-stone">Payment is handled securely by Razorpay. Vercenji never sees or stores your card details.</p>
    </form>
  );
}
