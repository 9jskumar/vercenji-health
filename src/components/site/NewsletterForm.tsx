"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/lib/actions/newsletter";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, {});

  if (state.ok) {
    return (
      <p role="status" className="m-0 rounded-2xl bg-ivory p-5 font-semibold text-forest">
        Thank you. You are on the list for Vercenji news.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <label htmlFor="nl-email" className="label">Email address</label>
      <div className="flex flex-wrap gap-2">
        <input id="nl-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="field min-w-0 flex-1" />
        <button type="submit" disabled={pending} className="btn-primary py-3 disabled:opacity-60">
          {pending ? "Joining…" : "Join"}
        </button>
      </div>
      <label className="flex items-start gap-2.5 text-sm leading-relaxed text-stone">
        <input type="checkbox" name="consent" className="mt-1 size-4 shrink-0 accent-green" />
        <span>
          Yes, send me offers and news by email. I can unsubscribe at any time. See our{" "}
          <Link href="/legal/privacy" target="_blank" className="text-green underline">privacy policy</Link>.
        </span>
      </label>
      {state.error && <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
    </form>
  );
}
