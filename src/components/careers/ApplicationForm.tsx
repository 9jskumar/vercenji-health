"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { keepValuesSubmit } from "@/lib/forms";
import { submitJobApplication, type ApplyState } from "@/lib/actions/careers";
import {
  careersCopy,
  CV_ACCEPT,
  CV_MAX_BYTES,
  educationOptions,
  employmentStatusOptions,
  experienceOptions,
  noticePeriodOptions,
} from "@/content/careers";

type Props =
  | { kind: "VACANCY"; formToken: string; job: { id: string; title: string; reference: string } }
  | { kind: "SPECULATIVE"; formToken: string; departments: string[] };

export function ApplicationForm(props: Props) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitJobApplication, {});
  const topRef = useRef<HTMLDivElement>(null);
  const err = (k: string) => state.fieldErrors?.[k];

  // Bring the result (thank-you or error summary) into view after each submit.
  useEffect(() => {
    if (state.ok || state.error) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  if (state.ok) {
    return (
      <div ref={topRef} role="status" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl bg-ivory p-8">
        <span className="font-serif text-[28px] leading-tight text-forest">Application received</span>
        <p className="m-0 leading-relaxed text-[#45453F]">{careersCopy.thankYou}</p>
        <p className="m-0 text-[#45453F]">
          Your application reference number is <strong className="font-mono text-forest">{state.reference}</strong>. Please keep it for any
          follow-up. A confirmation has been sent to your email address.
        </p>
        <Link href="/careers#openings" className="btn-ghost self-start">Back to all openings</Link>
      </div>
    );
  }

  return (
    <form onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-8" noValidate={false}>
      <div ref={topRef} className="scroll-mt-6">
        {state.error && (
          <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-4 text-sm font-semibold text-[#9B2C2C]">
            {state.error}
          </p>
        )}
      </div>
      <input type="hidden" name="kind" value={props.kind} />
      <input type="hidden" name="formToken" value={props.formToken} />
      {props.kind === "VACANCY" && <input type="hidden" name="jobId" value={props.job.id} />}
      {/* Honeypot for bots; hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Section title="Position">
        {props.kind === "VACANCY" ? (
          <Field label="Position applied for" name="positionDisplay">
            <input id="positionDisplay" value={`${props.job.title} (${props.job.reference})`} readOnly className="field bg-ivory" />
          </Field>
        ) : (
          <>
            <Field label="Role or position you are interested in" name="positionTitle" required error={err("positionTitle")}>
              <input id="positionTitle" name="positionTitle" required minLength={2} maxLength={160} placeholder="For example: Sales Executive, Nutritionist, Accountant" className="field" />
            </Field>
            <Field label="Area of interest" name="interestArea" error={err("interestArea")}>
              <select id="interestArea" name="interestArea" defaultValue="" className="field">
                <option value="">Any area</option>
                {props.departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </>
        )}
      </Section>

      <Section title="Your details">
        <Field label="Full name" name="fullName" required error={err("fullName")}>
          <input id="fullName" name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="field" />
        </Field>
        <Field label="Email address" name="email" required error={err("email")}>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="field" />
        </Field>
        <Field label="Mobile number (with country code)" name="phone" required error={err("phone")} hint="For example +91 98765 43210">
          <input id="phone" name="phone" type="tel" required defaultValue="+91 " pattern="\+[1-9][0-9 \(\)\-]{6,19}" autoComplete="tel" className="field" />
        </Field>
        <Field label="Current location" name="currentLocation" required error={err("currentLocation")} hint="City and state">
          <input id="currentLocation" name="currentLocation" required minLength={2} maxLength={120} autoComplete="address-level2" className="field" />
        </Field>
      </Section>

      <Section title="Experience and education">
        <Select label="Total work experience" name="totalExperience" options={experienceOptions} required error={err("totalExperience")} />
        <Select label="Current employment status" name="employmentStatus" options={employmentStatusOptions} required error={err("employmentStatus")} />
        <Select label="Highest educational qualification" name="education" options={educationOptions} required error={err("education")} />
        <Field label="Current or previous employer" name="currentEmployer" error={err("currentEmployer")} optional>
          <input id="currentEmployer" name="currentEmployer" maxLength={160} autoComplete="organization" className="field" />
        </Field>
        <Field label="LinkedIn profile" name="linkedinUrl" error={err("linkedinUrl")} optional>
          <input id="linkedinUrl" name="linkedinUrl" type="url" maxLength={300} placeholder="https://www.linkedin.com/in/your-name" className="field" />
        </Field>
        <Field label="Expected salary" name="expectedSalary" error={err("expectedSalary")} optional hint="For example ₹4.5 lakh per year">
          <input id="expectedSalary" name="expectedSalary" maxLength={80} className="field" />
        </Field>
        <Select label="Notice period or availability" name="noticePeriod" options={noticePeriodOptions} required error={err("noticePeriod")} />
      </Section>

      <div className="flex flex-col gap-4">
        <Field label="Cover letter or additional information" name="coverLetter" required error={err("coverLetter")} hint="Tell us why you would like to join Vercenji and what you would bring to the role.">
          <textarea id="coverLetter" name="coverLetter" required minLength={20} maxLength={4000} rows={6} className="field" />
        </Field>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cv" className="label">Upload CV / resume *</label>
          <span id="cv-help" className="text-sm text-stone">PDF, DOC or DOCX, up to 5 MB.</span>
          <input
            id="cv"
            name="cv"
            type="file"
            required
            accept={CV_ACCEPT}
            aria-describedby="cv-help"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              const msg = !f
                ? ""
                : !/\.(pdf|docx?)$/i.test(f.name)
                  ? "Please choose a PDF, DOC or DOCX file."
                  : f.size > CV_MAX_BYTES
                    ? "Your CV must be 5 MB or smaller."
                    : "";
              e.currentTarget.setCustomValidity(msg);
              if (msg) e.currentTarget.reportValidity();
            }}
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-green file:px-4 file:py-2 file:font-semibold file:text-white"
          />
          {err("cv") && <span className="text-sm font-semibold text-[#9B2C2C]">{err("cv")}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 text-[15px] leading-relaxed">
          <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-green" />
          <span>
            {careersCopy.consent.replace(" in accordance with the Privacy Policy.", " in accordance with the ")}
            <Link href="/legal/privacy" target="_blank" className="text-green underline">Privacy Policy</Link>. *
          </span>
        </label>
        {err("consent") && <span className="pl-7 text-sm font-semibold text-[#9B2C2C]">{err("consent")}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? "Submitting…" : "Submit Application"}
        </button>
        <span className="text-sm text-stone">Fields marked * are required.</span>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 grid grid-cols-1 gap-4 border-0 p-0 sm:grid-cols-2">
      <legend className="mb-4 font-serif text-2xl font-normal text-forest">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, name, required, optional, hint, error, children }: { label: string; name: string; required?: boolean; optional?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="label">
        {label}
        {required && " *"}
        {optional && <span className="font-normal text-stone"> (optional)</span>}
      </label>
      {hint && <span className="-mt-1 text-xs text-stone">{hint}</span>}
      {children}
      {error && <span className="text-sm font-semibold text-[#9B2C2C]">{error}</span>}
    </div>
  );
}

function Select({ label, name, options, required, error }: { label: string; name: string; options: readonly string[]; required?: boolean; error?: string }) {
  return (
    <Field label={label} name={name} required={required} error={error}>
      <select id={name} name={name} required={required} defaultValue="" className="field">
        <option value="" disabled>Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}
