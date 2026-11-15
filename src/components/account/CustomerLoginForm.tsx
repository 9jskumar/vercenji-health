"use client";

import { useActionState, useState } from "react";
import { keepValuesSubmit } from "@/lib/forms";
import { requestLoginCode, verifyLoginCode, type CodeRequestState, type CodeVerifyState } from "@/lib/actions/customer-auth";

function Alert({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{children}</p>;
}

export function CustomerLoginForm({ next }: { next: string }) {
  const [sent, request, requesting] = useActionState<CodeRequestState, FormData>(requestLoginCode, {});
  const [verified, verify, verifying] = useActionState<CodeVerifyState, FormData>(verifyLoginCode, {});
  const [changeEmail, setChangeEmail] = useState(false);
  const codeStep = !!sent.sentTo && !changeEmail;

  if (!codeStep) {
    return (
      <form
        onSubmit={(e) => {
          setChangeEmail(false);
          keepValuesSubmit(request)(e);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" defaultValue={sent.sentTo} className="field" />
          <span className="text-sm text-stone">We will email you a 6-digit code. No password needed.</span>
        </div>
        {sent.error && <Alert>{sent.error}</Alert>}
        <button type="submit" disabled={requesting} className="btn-primary py-3 disabled:opacity-60">
          {requesting ? "Sending…" : "Email me a code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={keepValuesSubmit(verify)} className="flex flex-col gap-4">
      <p className="m-0 text-[15px] leading-relaxed">
        We sent a code to <strong>{sent.sentTo}</strong>. It can take a minute to arrive; check your spam folder too.
      </p>
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="label">6-digit code</label>
        <input id="code" name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} required autoComplete="one-time-code" autoFocus className="field tracking-[0.3em]" />
      </div>
      {verified.error && <Alert>{verified.error}</Alert>}
      <button type="submit" disabled={verifying} className="btn-primary py-3 disabled:opacity-60">
        {verifying ? "Checking…" : "Sign in"}
      </button>
      <button type="button" onClick={() => setChangeEmail(true)} className="self-start text-sm font-bold text-green underline underline-offset-4">
        Use a different email or send a new code
      </button>
    </form>
  );
}
