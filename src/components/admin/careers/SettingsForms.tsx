"use client";

import { useActionState } from "react";
import { saveDepartment, saveSettings, saveTemplate, type AdminFormState } from "@/lib/actions/careers-admin";

const Msg = ({ state }: { state: AdminFormState }) =>
  state.error ? (
    <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>
  ) : state.ok ? (
    <p role="status" className="m-0 text-sm font-semibold text-green">{state.message ?? "Saved."}</p>
  ) : null;

export function RecruitmentSettingsForm({ notifyEmails, sendAcknowledgement, retentionMonths }: { notifyEmails: string[]; sendAcknowledgement: boolean; retentionMonths: number }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveSettings, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Recruitment notification email(s)
        <span className="text-xs font-normal text-stone">New applications are emailed here. Separate up to 5 addresses with commas. Candidates&apos; replies also go to the first address.</span>
        <input name="notifyEmails" defaultValue={notifyEmails.join(", ")} placeholder="e.g. careers@vercenji.com" className="field font-normal" />
        {e("notifyEmails") && <span className="font-semibold text-[#9B2C2C]">{e("notifyEmails")}</span>}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="sendAcknowledgement" defaultChecked={sendAcknowledgement} className="size-4 accent-green" />
        Send candidates an automatic acknowledgement email
      </label>
      <label className="flex max-w-[260px] flex-col gap-1.5 text-sm font-semibold">
        Keep candidate data for (months)
        <input name="retentionMonths" type="number" min={1} max={60} defaultValue={retentionMonths} className="field font-normal" />
        <span className="text-xs font-normal text-stone">Applies to new applications. Must match the privacy notice.</span>
        {e("retentionMonths") && <span className="font-semibold text-[#9B2C2C]">{e("retentionMonths")}</span>}
      </label>
      <Msg state={state} />
      <button type="submit" disabled={pending} className="btn-primary self-start py-3 disabled:opacity-60">{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}

export function TemplateForm({ tpl }: { tpl: { key: string; name: string; subject: string; body: string } }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveTemplate, {});
  return (
    <details className="group rounded-2xl bg-white ring-1 ring-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-forest">
        {tpl.name}
        <span aria-hidden="true" className="text-gold group-open:rotate-45">+</span>
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t border-line p-4">
        <input type="hidden" name="key" value={tpl.key} />
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Subject
          <input name="subject" defaultValue={tpl.subject} required maxLength={190} className="field font-normal" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email text
          <textarea name="body" defaultValue={tpl.body} required rows={10} maxLength={8000} className="field font-mono text-sm font-normal" />
        </label>
        <Msg state={state} />
        <button type="submit" disabled={pending} className="btn-primary self-start py-2.5 disabled:opacity-60">{pending ? "Saving…" : "Save template"}</button>
      </form>
    </details>
  );
}

export function DepartmentForm({ dept }: { dept?: { id: string; name: string; group: string; sortOrder: number; isActive: boolean } }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveDepartment, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      {dept && <input type="hidden" name="id" value={dept.id} />}
      <label className="flex flex-[1_1_220px] flex-col gap-1 text-sm font-semibold">
        {dept ? "Name" : "New department"}
        <input name="name" defaultValue={dept?.name} required minLength={2} maxLength={80} className="field py-2 font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Group
        <select name="group" defaultValue={dept?.group ?? "FUNCTION"} className="field py-2 font-normal">
          <option value="VERTICAL">Business vertical</option>
          <option value="FUNCTION">Team or function</option>
        </select>
      </label>
      <label className="flex w-24 flex-col gap-1 text-sm font-semibold">
        Order
        <input name="sortOrder" type="number" min={0} max={9999} defaultValue={dept?.sortOrder ?? 200} className="field py-2 font-normal" />
      </label>
      {dept && (
        <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold">
          <input type="checkbox" name="isActive" defaultChecked={dept.isActive} className="size-4 accent-green" /> Shown
        </label>
      )}
      <button type="submit" disabled={pending} className="btn-ghost px-4 py-2 text-sm disabled:opacity-60">{dept ? "Save" : "Add"}</button>
      <div className="basis-full"><Msg state={state} /></div>
    </form>
  );
}
