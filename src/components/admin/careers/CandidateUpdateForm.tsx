"use client";

import { useActionState, useRef, useState } from "react";
import { updateCandidate, type AdminFormState } from "@/lib/actions/careers-admin";
import { candidateStatusLabels, templateForStatus } from "@/content/careers";
import type { CandidateStatus } from "@/generated/prisma/enums";

export function CandidateUpdateForm({ id, status, templates, canEmail }: { id: string; status: CandidateStatus; templates: { key: string; name: string }[]; canEmail: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [next, setNext] = useState<CandidateStatus>(status);
  const [sendEmail, setSendEmail] = useState(false);
  const [templateKey, setTemplateKey] = useState(templateForStatus[status] ?? "status_update");
  const [state, action, pending] = useActionState<AdminFormState, FormData>(async (prev, fd) => {
    const res = await updateCandidate(prev, fd);
    if (res.ok) {
      formRef.current?.reset();
      setSendEmail(false);
    }
    return res;
  }, {});
  const usable = templates.filter((t) => t.key !== "application_received");

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Status
        <select
          name="status"
          value={next}
          onChange={(e) => {
            const s = e.target.value as CandidateStatus;
            setNext(s);
            if (templateForStatus[s]) setTemplateKey(templateForStatus[s]!);
          }}
          className="field"
        >
          {(Object.keys(candidateStatusLabels) as CandidateStatus[]).map((s) => <option key={s} value={s}>{candidateStatusLabels[s]}</option>)}
        </select>
      </label>
      {canEmail && (
        <div className="flex flex-col gap-3 rounded-xl bg-ivory p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="sendEmail" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="size-4 accent-green" />
            Email the candidate
          </label>
          {sendEmail && (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Template
                <select name="templateKey" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} className="field">
                  {usable.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Details for the email
                <span className="text-xs font-normal text-stone">Fills {"{{details}}"} in the template, e.g. interview date, time, place or video link.</span>
                <textarea name="details" rows={4} maxLength={3000} className="field font-normal" />
              </label>
            </>
          )}
        </div>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Internal note
        <textarea name="note" rows={3} maxLength={4000} placeholder="Visible to staff only" className="field font-normal" />
      </label>
      {state.error && <p role="alert" className="m-0 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>}
      {state.ok && <p role="status" className="m-0 text-sm font-semibold text-green">{state.message ?? "Saved."}</p>}
      <button type="submit" disabled={pending} className="btn-primary py-3 disabled:opacity-60">{pending ? "Saving…" : sendEmail ? "Save and send email" : "Save"}</button>
    </form>
  );
}
