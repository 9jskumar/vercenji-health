"use client";

import { useActionState } from "react";
import { keepValuesSubmit } from "@/lib/forms";
import { saveJob, type AdminFormState } from "@/lib/actions/careers-admin";
import { employmentTypeLabels, experienceLevelLabels, indianStates, workArrangementLabels } from "@/content/careers";
import { Input, Notice, TextArea } from "../FormBits";

export type JobFormValues = {
  id?: string;
  status?: string;
  title: string;
  departmentIds: string[];
  employmentType: string;
  workArrangement: string;
  experienceLevel: string;
  experienceText: string;
  education: string;
  city: string;
  state: string;
  openings: number;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: string;
  showSalary: boolean;
  compensationNote: string;
  shortDescription: string;
  summary: string;
  responsibilities: string;
  skills: string;
  preferred: string;
  deadline: string;
  isUrgent: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
};

type Dept = { id: string; name: string; group: string; isActive: boolean };

export function JobForm({ values, departments }: { values: JobFormValues; departments: Dept[] }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveJob, {});
  const e = (k: string) => state.fieldErrors?.[k];
  const isNew = !values.id;
  const isDraft = !values.status || values.status === "DRAFT";

  const select = (name: keyof JobFormValues, label: string, options: Record<string, string>) => (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label} *
      <select name={name} defaultValue={String(values[name] ?? "")} required className="field font-normal">
        <option value="" disabled>Select…</option>
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {e(name) && <span className="font-semibold text-[#9B2C2C]">{e(name)}</span>}
    </label>
  );

  return (
    <form onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Notice state={state} />

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Basics</h2>
        <Input label="Job title *" name="title" defaultValue={values.title} required minLength={3} maxLength={120} error={e("title")} />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1.5 text-sm font-semibold">Departments * <span className="font-normal text-stone">(choose one or more)</span></legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="departmentIds" value={d.id} defaultChecked={values.departmentIds.includes(d.id)} className="size-4 accent-green" />
                {d.name}
                {!d.isActive && <span className="text-xs text-stone">(hidden)</span>}
              </label>
            ))}
          </div>
          {e("departmentIds") && <span className="text-sm font-semibold text-[#9B2C2C]">{e("departmentIds")}</span>}
        </fieldset>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {select("employmentType", "Employment type", employmentTypeLabels)}
          {select("workArrangement", "Work arrangement", workArrangementLabels)}
          {select("experienceLevel", "Experience level (for the filter)", experienceLevelLabels)}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Experience required *" name="experienceText" defaultValue={values.experienceText} required maxLength={160} placeholder="e.g. 2 to 4 years in FMCG or nutrition sales" error={e("experienceText")} />
          <Input label="Education requirements *" name="education" defaultValue={values.education} required maxLength={200} placeholder="e.g. Graduate in any discipline; MBA preferred" error={e("education")} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="City *" name="city" defaultValue={values.city} required maxLength={80} placeholder="e.g. Vadodara" error={e("city")} />
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            State *
            <input name="state" list="indian-states" defaultValue={values.state} required maxLength={80} className="field font-normal" />
            <datalist id="indian-states">{indianStates.map((s) => <option key={s} value={s} />)}</datalist>
            {e("state") && <span className="font-semibold text-[#9B2C2C]">{e("state")}</span>}
          </label>
          <Input label="Number of openings" name="openings" type="number" min={1} max={500} defaultValue={values.openings} error={e("openings")} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Description</h2>
        <TextArea label="Short description for the job card *" name="shortDescription" defaultValue={values.shortDescription} required minLength={20} maxLength={400} rows={2} hint="20 to 400 characters. Also used for search results if no SEO description is set." error={e("shortDescription")} />
        <TextArea label="Job summary *" name="summary" defaultValue={values.summary} required rows={5} maxLength={6000} error={e("summary")} />
        <TextArea label="Key responsibilities *" name="responsibilities" defaultValue={values.responsibilities} required rows={6} maxLength={6000} hint="One per line." error={e("responsibilities")} />
        <TextArea label="Required skills and competencies *" name="skills" defaultValue={values.skills} required rows={5} maxLength={6000} hint="One per line." error={e("skills")} />
        <TextArea label="Preferred qualifications" name="preferred" defaultValue={values.preferred} rows={4} maxLength={4000} hint="Optional. One per line." error={e("preferred")} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Compensation <span className="font-normal text-stone">(optional)</span></h2>
        <p className="m-0 text-sm text-stone">Only publish figures the company has approved. The salary is shown on the site, and in Google job results, only when “Show salary” is ticked.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="Minimum (₹)" name="salaryMin" inputMode="numeric" defaultValue={values.salaryMin} placeholder="e.g. 300000" error={e("salaryMin")} />
          <Input label="Maximum (₹)" name="salaryMax" inputMode="numeric" defaultValue={values.salaryMax} placeholder="e.g. 450000" error={e("salaryMax")} />
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Per
            <select name="salaryPeriod" defaultValue={values.salaryPeriod || "YEAR"} className="field font-normal">
              <option value="YEAR">Year</option>
              <option value="MONTH">Month</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="showSalary" defaultChecked={values.showSalary} className="size-4 accent-green" /> Show salary on the job page
        </label>
        <TextArea label="Compensation note" name="compensationNote" defaultValue={values.compensationNote} rows={2} maxLength={1000} hint="Optional, e.g. “As per industry standards, based on experience.” Do not promise benefits that are not confirmed." error={e("compensationNote")} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Visibility</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="Application deadline" name="deadline" type="date" defaultValue={values.deadline} hint="Applications close at the end of this day (India time). Leave empty for “open until filled”." error={e("deadline")} />
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" name="isUrgent" defaultChecked={values.isUrgent} className="size-4 accent-green" /> Mark as urgent
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="size-4 accent-green" /> Feature at the top
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="SEO title" name="seoTitle" defaultValue={values.seoTitle} maxLength={70} hint="Optional, up to 70 characters." error={e("seoTitle")} />
          <Input label="SEO description" name="seoDescription" defaultValue={values.seoDescription} maxLength={170} hint="Optional, up to 170 characters." error={e("seoDescription")} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {isNew || isDraft ? (
          <>
            <button type="submit" name="intent" value="draft" disabled={pending} className="btn-ghost py-3 disabled:opacity-60">
              {pending ? "Saving…" : isNew ? "Save as draft" : "Save draft"}
            </button>
            <button type="submit" name="intent" value="publish" disabled={pending} className="btn-primary py-3 disabled:opacity-60">
              Publish now
            </button>
          </>
        ) : (
          <button type="submit" name="intent" value="save" disabled={pending} className="btn-primary py-3 disabled:opacity-60">
            {pending ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>
    </form>
  );
}
