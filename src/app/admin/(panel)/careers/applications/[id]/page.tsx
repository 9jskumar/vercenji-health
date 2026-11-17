import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { deleteCandidate } from "@/lib/actions/careers-admin";
import { jobPath } from "@/lib/careers";
import { CandidateUpdateForm } from "@/components/admin/careers/CandidateUpdateForm";
import { dateTime } from "@/content/admin";
import { candidateStatusLabels, candidateStatusTone } from "@/content/careers";

export default async function CandidateDetail({ params, searchParams }: PageProps<"/admin/careers/applications/[id]">) {
  const staff = await requireStaff(PERMISSIONS.careersApplications);
  await connection();
  const { id } = await params;
  const sp = await searchParams;
  const app = await db.jobApplication.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, reference: true, slug: true, status: true } },
      documents: { orderBy: { createdAt: "asc" } },
      history: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      emails: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!app) notFound();
  const templates = await db.recruitmentEmailTemplate.findMany({ orderBy: { name: "asc" }, select: { key: true, name: true } });
  const actorIds = [...new Set([...app.history.map((h) => h.actorId), ...app.notes.map((n) => n.authorId), ...app.emails.map((e) => e.sentById)].filter((x): x is string => !!x))];
  const actors = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } });
  const who = (uid: string | null) => {
    if (!uid) return "System";
    const a = actors.find((x) => x.id === uid);
    return a?.name ?? a?.email ?? "Staff";
  };
  const canCv = hasPermission(staff.permissions, PERMISSIONS.careersCvs);
  const canDelete = hasPermission(staff.permissions, PERMISSIONS.careersManage);

  const rows: [string, React.ReactNode][] = [
    ["Position", app.job ? <Link key="j" href={`/admin/careers/jobs/${app.job.id}`} className="text-green underline">{app.job.title} ({app.job.reference})</Link> : `Future opportunities: ${app.positionTitle}`],
    ...(app.interestArea ? ([["Area of interest", app.interestArea]] as [string, string][]) : []),
    ["Email", <a key="e" href={`mailto:${app.email}`} className="text-green underline">{app.email}</a>],
    ["Mobile", <a key="p" href={`tel:${app.phone}`} className="text-green underline">{app.phone}</a>],
    ["Current location", app.currentLocation],
    ["Total experience", app.totalExperience],
    ["Employment status", app.employmentStatus],
    ["Highest qualification", app.education],
    ["Current or previous employer", app.currentEmployer ?? "—"],
    ["LinkedIn", app.linkedinUrl ? <a key="l" href={app.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-green underline">{app.linkedinUrl}</a> : "—"],
    ["Expected salary", app.expectedSalary ?? "—"],
    ["Notice period", app.noticePeriod],
    ["Consent", `${dateTime(app.consentAt)} (privacy notice ${app.privacyNoticeVersion})`],
    ["Keep until", dateTime(app.retainUntil)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/careers/applications" className="text-sm font-semibold text-green underline">← All candidates</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">{app.fullName}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${candidateStatusTone[app.status]}`}>{candidateStatusLabels[app.status]}</span>
      </div>
      <p className="m-0 text-sm text-stone">
        <span className="font-mono">{app.reference}</span> · applied {dateTime(app.createdAt)}
        {app.job?.status === "PUBLISHED" && <> · <Link href={jobPath(app.job)} target="_blank" className="text-green underline">view vacancy</Link></>}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[200px_1fr]">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-sm font-semibold text-stone">{k}</dt>
                  <dd className="m-0">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-3 text-base font-bold">CV / resume</h2>
            {app.documents.length === 0 ? (
              <p className="m-0 text-stone">No CV on file.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {app.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{d.originalName} <span className="text-sm text-stone">({Math.ceil(d.sizeBytes / 1024)} KB)</span></span>
                    {canCv ? <a href={`/admin/careers/cv/${d.id}`} className="btn-ghost px-4 py-2 text-sm">Download CV</a> : <span className="text-sm text-stone">Ask an administrator for access</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-2 text-base font-bold">Cover letter and additional information</h2>
            <p className="m-0 whitespace-pre-wrap text-[#45453F]">{app.coverLetter}</p>
          </section>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-3 text-base font-bold">Emails</h2>
            {app.emails.length === 0 ? (
              <p className="m-0 text-sm text-stone">No emails yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {app.emails.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1 border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <span className="flex flex-wrap items-center gap-2 text-xs text-stone">
                      {dateTime(e.createdAt)} · {e.kind === "admin_alert" ? "Team alert" : e.kind === "candidate_ack" ? "Acknowledgement" : `Sent by ${who(e.sentById)}`} · to {e.toEmail}
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${e.status === "SENT" ? "bg-[#DCE6DC] text-forest" : "bg-[#FBEAEA] text-[#9B2C2C]"}`}>
                        {e.status === "SENT" ? "Sent" : e.status === "FAILED" ? "Failed" : "Not sent"}
                      </span>
                    </span>
                    <details>
                      <summary className="cursor-pointer text-sm font-semibold">{e.subject}</summary>
                      <p className="m-0 mt-2 text-sm whitespace-pre-wrap text-[#45453F]">{e.body}</p>
                    </details>
                    {e.error && <span className="text-xs text-[#9B2C2C]">{e.error}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 text-base font-bold">Update</h2>
            <CandidateUpdateForm id={app.id} status={app.status} templates={templates} canEmail />
          </section>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-3 text-base font-bold">Internal notes</h2>
            {app.notes.length === 0 ? (
              <p className="m-0 text-sm text-stone">No notes yet.</p>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {app.notes.map((n) => (
                  <li key={n.id} className="flex flex-col gap-1 border-l-2 border-gold pl-3">
                    <span className="text-xs text-stone">{dateTime(n.createdAt)} · {who(n.authorId)}</span>
                    <p className="m-0 text-sm whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-3 text-base font-bold">Status history</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {app.history.map((h) => (
                <li key={h.id} className="flex flex-col gap-0.5 border-l-2 border-green pl-3">
                  <span className="text-xs text-stone">{dateTime(h.createdAt)} · {who(h.actorId)}</span>
                  <span className="text-sm font-semibold">
                    {h.fromStatus ? `${candidateStatusLabels[h.fromStatus]} → ` : ""}{candidateStatusLabels[h.toStatus]}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          {canDelete && (
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-[#E8C4C4]">
              <h2 className="m-0 text-base font-bold text-[#9B2C2C]">Delete candidate data</h2>
              <p className="m-0 text-sm text-stone">Use this when the candidate asks for their data to be erased, or when the keep-until date has passed. The application, CV, notes and emails are removed permanently.</p>
              <form action={deleteCandidate} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={app.id} />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="confirm" required className="mt-0.5 size-4 accent-[#9B2C2C]" />
                  I understand this cannot be undone.
                </label>
                {sp.confirm && <span className="text-sm font-semibold text-[#9B2C2C]">Tick the box to confirm.</span>}
                <button type="submit" className="btn self-start border-[1.5px] border-[#9B2C2C] px-4 py-2 text-sm text-[#9B2C2C] hover:bg-[#9B2C2C] hover:text-white">Delete permanently</button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
