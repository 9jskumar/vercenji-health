"use client";

import Link from "next/link";
import { keepValuesSubmit } from "@/lib/forms";
import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitPartnerApplication, type PartnerFormState } from "@/lib/actions/partner";
import {
  countries,
  investmentRanges,
  kitchenStructures,
  launchTimelines,
  partnerModels,
  partnershipDisclaimer,
  type PartnerModelId,
} from "@/content/partner";

const steps = ["About you", "Your proposal", "Documents and consent"] as const;
const stepOfField: Record<string, number> = {
  fullName: 0, companyName: 0, email: 0, phone: 0, country: 0, city: 0,
  model: 1, proposedLocation: 1, investmentRange: 1, launchTimeline: 1, hasKitchen: 1, kitchenStructure: 1, experience: 1, proposal: 1,
  consentPrivacy: 2, consentDisclaimer: 2, documents: 2,
};

function isModel(v: string | null): v is PartnerModelId {
  return !!v && partnerModels.some((m) => m.id === v);
}

export function PartnerApplicationForm() {
  const params = useSearchParams();
  const initialModel = params.get("model");
  const [model, setModel] = useState<PartnerModelId>(isModel(initialModel) ? initialModel : "WELLNESS_HUB");
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState<PartnerFormState, FormData>(submitPartnerApplication, {});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Let "Apply for this model" buttons elsewhere on the page preselect the model.
  useEffect(() => {
    const onPick = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (isModel(id)) {
        setModel(id);
        setStep((s) => (s === 2 ? 1 : s));
      }
    };
    window.addEventListener("vercenji:pick-model", onPick);
    return () => window.removeEventListener("vercenji:pick-model", onPick);
  }, []);

  // After a failed submit, jump to the first step that has an error (adjusting state during render).
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    const keys = Object.keys(state.fieldErrors ?? {});
    if (keys.length) setStep(Math.min(...keys.map((k) => stepOfField[k] ?? 0)));
  }

  // Move focus to the form heading when the step changes, but not on first load (that would scroll the page).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const err = (name: string) => state.fieldErrors?.[name];
  const modelName = partnerModels.find((m) => m.id === model)?.name;

  function next() {
    const fieldset = formRef.current?.querySelector<HTMLFieldSetElement>(`fieldset[data-step="${step}"]`);
    const fields = fieldset ? Array.from(fieldset.querySelectorAll<HTMLInputElement>("input, select, textarea")) : [];
    for (const f of fields) {
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-3xl bg-ivory p-8">
        <span className="font-serif text-2xl text-forest">Thank you, we&apos;ve received your application</span>
        <span>
          Your reference number is <strong>{state.reference}</strong>. Please keep it for any follow-up.
        </span>
        <span className="text-stone">Our partnerships team reviews every application personally and will contact you by email or phone.</span>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="m-0 font-serif text-[32px] font-normal text-forest outline-none">
          Partnership application
        </h2>
        <span className="text-sm text-stone">
          Model: <strong className="text-forest">{modelName}</strong>
        </span>
      </div>

      <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Application steps">
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`flex items-center gap-2.5 rounded-full py-2 pr-3.5 pl-2 text-sm font-semibold ${
              i === step ? "bg-green text-white" : i < step ? "bg-[#DCE6DC] text-forest" : "bg-ivory text-stone"
            }`}
          >
            <span className="flex size-[26px] items-center justify-center rounded-full bg-white text-[13px] text-green">{i < step ? "✓" : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {state.error && (
        <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-4 text-sm font-semibold text-[#9B2C2C]">
          {state.error}
        </p>
      )}

      {/* Honeypot for bots; hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset data-step="0" hidden={step !== 0} className="m-0 grid grid-cols-1 gap-4 border-0 p-0 sm:grid-cols-2">
        <legend className="sr-only">About you</legend>
        <Field label="Full name" name="fullName" required error={err("fullName")}>
          <input id="fullName" name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="field" />
        </Field>
        <Field label="Company name" name="companyName" error={err("companyName")}>
          <input id="companyName" name="companyName" maxLength={160} autoComplete="organization" className="field" />
        </Field>
        <Field label="Email" name="email" required error={err("email")}>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="field" />
        </Field>
        <Field label="Mobile number" name="phone" required error={err("phone")}>
          <input id="phone" name="phone" type="tel" required pattern="\+?[0-9 \(\)\-]{8,20}" autoComplete="tel" className="field" />
        </Field>
        <Field label="Country" name="country" required error={err("country")}>
          <select id="country" name="country" required defaultValue="IN" className="field">
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="City" name="city" required error={err("city")}>
          <input id="city" name="city" required minLength={2} maxLength={80} autoComplete="address-level2" className="field" />
        </Field>
      </fieldset>

      <fieldset data-step="1" hidden={step !== 1} className="m-0 flex flex-col gap-4 border-0 p-0">
        <legend className="sr-only">Your proposal</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Preferred partnership model" name="model" required error={err("model")}>
            <select id="model" name="model" required value={model} onChange={(e) => setModel(e.target.value as PartnerModelId)} className="field">
              {partnerModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Preferred location" name="proposedLocation" required error={err("proposedLocation")}>
            <input id="proposedLocation" name="proposedLocation" required minLength={2} maxLength={160} placeholder="City, area or emirate" className="field" />
          </Field>
          <Field label="Proposed investment range" name="investmentRange" required error={err("investmentRange")}>
            <select id="investmentRange" name="investmentRange" required defaultValue="" className="field">
              <option value="" disabled>Select a range</option>
              {investmentRanges.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Expected opening timeline" name="launchTimeline" error={err("launchTimeline")}>
            <select id="launchTimeline" name="launchTimeline" defaultValue="" className="field">
              <option value="">Select a timeline</option>
              {launchTimelines.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Do you have premises or a kitchen available?" name="hasKitchen" error={err("hasKitchen")}>
            <select id="hasKitchen" name="hasKitchen" defaultValue="" className="field">
              <option value="">Select an answer</option>
              <option value="yes-owned">Yes, owned</option>
              <option value="yes-leased">Yes, leased</option>
              <option value="no">Not yet</option>
            </select>
          </Field>
          {model === "CLOUD_KITCHEN" && (
            <Field label="Preferred kitchen structure" name="kitchenStructure" required error={err("kitchenStructure")}>
              <select id="kitchenStructure" name="kitchenStructure" required defaultValue="" className="field">
                <option value="" disabled>Select a structure</option>
                {kitchenStructures.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <Field label="Relevant experience" name="experience" error={err("experience")}>
          <textarea id="experience" name="experience" rows={3} maxLength={2000} placeholder="Wellness, fitness, food service, retail or business experience" className="field" />
        </Field>
        <Field label="Brief proposal and comments" name="proposal" error={err("proposal")}>
          <textarea id="proposal" name="proposal" rows={4} maxLength={4000} className="field" />
        </Field>
      </fieldset>

      <fieldset data-step="2" hidden={step !== 2} className="m-0 flex flex-col gap-4 border-0 p-0">
        <legend className="sr-only">Documents and consent</legend>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="documents" className="label">Supporting documents (optional)</label>
          <span id="documents-help" className="text-sm text-stone">
            Company profile, premises photos or licences. PDF, JPG or PNG, up to 3 files of 10 MB each.
          </span>
          <input
            id="documents"
            name="documents"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            aria-describedby="documents-help"
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              const msg =
                files.length > 3 ? "Please choose at most 3 files."
                : files.some((f) => f.size > 10 * 1024 * 1024) ? "Each file must be 10 MB or smaller."
                : "";
              e.currentTarget.setCustomValidity(msg);
              if (msg) e.currentTarget.reportValidity();
            }}
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-green file:px-4 file:py-2 file:font-semibold file:text-white"
          />
          {err("documents") && <span className="text-sm font-semibold text-[#9B2C2C]">{err("documents")}</span>}
        </div>
        <div className="rounded-2xl border border-line bg-ivory p-5 text-sm leading-relaxed text-[#45453F]">
          <strong className="text-forest">Partnership disclaimer.</strong> {partnershipDisclaimer}
        </div>
        <Check name="consentPrivacy" required error={err("consentPrivacy")}>
          I have read the <Link href="/legal/privacy" target="_blank" className="text-green underline">privacy notice</Link> and agree to be contacted about my application. *
        </Check>
        <Check name="consentDisclaimer" required error={err("consentDisclaimer")}>
          I have read and understood the partnership disclaimer. *
        </Check>
        <Check name="marketing">Optional: send me Vercenji news and offers by email.</Check>
      </fieldset>

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost py-3 disabled:invisible">
          Back
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={next} className="btn-primary py-3">Continue</button>
        ) : (
          <button type="submit" disabled={pending} className="btn-primary py-3 disabled:opacity-60">
            {pending ? "Submitting…" : "Submit application"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, name, required, error, children }: { label: string; name: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="label">
        {label}
        {required && " *"}
      </label>
      {children}
      {error && <span className="text-sm font-semibold text-[#9B2C2C]">{error}</span>}
    </div>
  );
}

function Check({ name, required, error, children }: { name: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2.5 text-[15px] leading-relaxed">
        <input type="checkbox" name={name} required={required} className="mt-1 size-4 shrink-0 accent-green" />
        <span>{children}</span>
      </label>
      {error && <span className="pl-6 text-sm font-semibold text-[#9B2C2C]">{error}</span>}
    </div>
  );
}
