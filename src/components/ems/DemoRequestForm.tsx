"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitEquipmentEnquiry, type EnquiryFormState } from "@/lib/actions/equipment";
import { keepValuesSubmit } from "@/lib/forms";
import { enquiryCountries, enquiryInterests } from "@/content/ems";
import { company } from "@/lib/site";

function Field({ label, name, error, required, children }: { label: string; name: string; error?: string; required?: boolean; children?: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-charcoal" htmlFor={name}>
      <span>{label}{required && <span aria-hidden="true" className="text-gold-deep"> *</span>}</span>
      {children}
      {error && <span id={`${name}-error`} className="font-semibold text-[#9B2C2C]">{error}</span>}
    </label>
  );
}

export function DemoRequestForm() {
  const [state, action, pending] = useActionState<EnquiryFormState, FormData>(submitEquipmentEnquiry, {});
  const e = (k: string) => state.fieldErrors?.[k];
  const aria = (k: string) => (e(k) ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col gap-3 text-center">
        <h3 className="m-0 font-serif text-3xl font-normal text-forest">Thank you. Your request is with our team.</h3>
        <p className="m-0 leading-relaxed text-stone">
          We will contact you to arrange your demo or quotation. If it is urgent, email{" "}
          <a href={`mailto:${company.supportEmail}`} className="text-green underline">{company.supportEmail}</a> or call{" "}
          <a href={`tel:${company.supportPhone.replace(/\s/g, "")}`} className="text-green underline">{company.supportPhone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={keepValuesSubmit(action)} noValidate={false} className="flex flex-col gap-5">
      {state.error && <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" error={e("name")} required>
          <input id="name" name="name" required autoComplete="name" maxLength={120} className="field font-normal" {...aria("name")} />
        </Field>
        <Field label="Business name" name="company" error={e("company")}>
          <input id="company" name="company" autoComplete="organization" maxLength={160} className="field font-normal" {...aria("company")} />
        </Field>
        <Field label="Email" name="email" error={e("email")} required>
          <input id="email" name="email" type="email" required autoComplete="email" maxLength={254} className="field font-normal" {...aria("email")} />
        </Field>
        <Field label="Mobile number" name="phone" error={e("phone")} required>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" maxLength={20} placeholder="+91 98765 43210" className="field font-normal" {...aria("phone")} />
        </Field>
        <Field label="City" name="city" error={e("city")}>
          <input id="city" name="city" autoComplete="address-level2" maxLength={80} className="field font-normal" {...aria("city")} />
        </Field>
        <Field label="Country" name="country" error={e("country")} required>
          <select id="country" name="country" required defaultValue="IN" className="field font-normal" {...aria("country")}>
            {enquiryCountries.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
        </Field>
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold text-charcoal">I would like <span aria-hidden="true" className="text-gold-deep">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {enquiryInterests.map(([k, l], i) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-full bg-ivory px-4 py-2 text-sm ring-1 ring-line has-[:checked]:bg-green has-[:checked]:text-white">
              <input type="radio" name="interest" value={k} defaultChecked={i === 0} required className="accent-gold" />
              {l}
            </label>
          ))}
        </div>
        {e("interest") && <span className="text-sm font-semibold text-[#9B2C2C]">{e("interest")}</span>}
      </fieldset>
      <Field label="Tell us about your studio or requirements" name="message" error={e("message")}>
        <textarea id="message" name="message" rows={4} maxLength={3000} placeholder="Number of suits, fit option, sizes, timeline, branding…" className="field font-normal" {...aria("message")} />
      </Field>
      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="flex items-start gap-2.5 text-sm leading-relaxed text-stone">
        <input type="checkbox" name="consent" required className="mt-1 accent-green" {...aria("consent")} />
        <span>
          I agree to be contacted about this request, as described in the{" "}
          <Link href="/legal/privacy" target="_blank" className="text-green underline">privacy notice</Link>. <span aria-hidden="true" className="text-gold-deep">*</span>
        </span>
      </label>
      {e("consent") && <span id="consent-error" className="text-sm font-semibold text-[#9B2C2C]">{e("consent")}</span>}
      <button type="submit" disabled={pending} className="btn-primary self-start disabled:opacity-60">
        {pending ? "Sending…" : "Request a demo"}
      </button>
    </form>
  );
}
