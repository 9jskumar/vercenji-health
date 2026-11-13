"use client";

import { keepValuesSubmit } from "@/lib/forms";
import { useActionState } from "react";
import { staffLogin, type LoginState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(staffLogin, {});
  return (
    <form onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="label">6-digit code from your authenticator app</label>
        <input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" className="field tracking-[0.3em]" />
      </div>
      {state.error && <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary py-3 disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
