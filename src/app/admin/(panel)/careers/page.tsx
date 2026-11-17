import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getRecruitmentSettings, openJobsWhere } from "@/lib/careers";
import { dateTime } from "@/content/admin";
import { candidateStatusLabels, candidateStatusTone } from "@/content/careers";
import type { CandidateStatus } from "@/generated/prisma/enums";

export default async function CareersDashboard() {
  await requireStaff(PERMISSIONS.careersApplications);
  await connection();
  const now = new Date();
  const [activeJobs, closedJobs, draftJobs, expiredJobs, total, byStatus, byJob, speculative, recent, settings, failedEmails] = await Promise.all([
    db.jobVacancy.count({ where: openJobsWhere(now) }),
    db.jobVacancy.count({ where: { status: "CLOSED" } }),
    db.jobVacancy.count({ where: { status: "DRAFT" } }),
    db.jobVacancy.count({ where: { status: "PUBLISHED", deadline: { lt: now } } }),
    db.jobApplication.count(),
    db.jobApplication.groupBy({ by: ["status"], _count: true }),
    db.jobApplication.groupBy({ by: ["jobId"], where: { kind: "VACANCY" }, _count: true, orderBy: { _count: { jobId: "desc" } }, take: 15 }),
    db.jobApplication.count({ where: { kind: "SPECULATIVE" } }),
    db.jobApplication.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, reference: true, fullName: true, positionTitle: true, kind: true, status: true, createdAt: true } }),
    getRecruitmentSettings(),
    db.recruitmentEmailLog.count({ where: { status: { in: ["FAILED", "SKIPPED"] }, createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } } }),
  ]);
  const jobs = await db.jobVacancy.findMany({ where: { id: { in: byJob.map((r) => r.jobId!).filter(Boolean) } }, select: { id: true, title: true, reference: true, status: true } });
  const count = (s: CandidateStatus) => byStatus.find((r) => r.status === s)?._count ?? 0;

  const tiles: [string, number, string][] = [
    ["Active vacancies", activeJobs, "/admin/careers/jobs?status=PUBLISHED"],
    ["Applications received", total, "/admin/careers/applications"],
    ["Awaiting review", count("NEW"), "/admin/careers/applications?status=NEW"],
    ["Shortlisted", count("SHORTLISTED"), "/admin/careers/applications?status=SHORTLISTED"],
    ["Interviews scheduled", count("INTERVIEW_SCHEDULED"), "/admin/careers/applications?status=INTERVIEW_SCHEDULED"],
    ["Selected", count("SELECTED"), "/admin/careers/applications?status=SELECTED"],
    ["Closed positions", closedJobs, "/admin/careers/jobs?status=CLOSED"],
    ["Future-opportunity profiles", speculative, "/admin/careers/applications?kind=SPECULATIVE"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Recruitment</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/careers" target="_blank" className="btn-ghost px-5 py-2.5 text-sm">View careers page</Link>
          <Link href="/admin/careers/jobs/new" className="btn-primary px-5 py-2.5 text-sm">New vacancy</Link>
        </div>
      </div>

      {settings.notifyEmails.length === 0 && (
        <p role="alert" className="m-0 rounded-xl bg-[#FBF1DC] p-4 text-sm font-semibold text-[#7A5A1E]">
          No recruitment email is set, so nobody is emailed about new applications.{" "}
          <Link href="/admin/careers/settings" className="text-[#7A5A1E] underline">Set it in Settings</Link>.
        </p>
      )}
      {failedEmails > 0 && (
        <p className="m-0 rounded-xl bg-[#FBEAEA] p-4 text-sm font-semibold text-[#9B2C2C]">
          {failedEmails} recruitment email(s) could not be sent in the last 7 days. Open the candidate to see which.
        </p>
      )}
      {(expiredJobs > 0 || draftJobs > 0) && (
        <p className="m-0 text-sm text-stone">
          {expiredJobs > 0 && <><Link href="/admin/careers/jobs?status=EXPIRED" className="font-semibold text-green underline">{expiredJobs} published vacancy(ies) past the deadline</Link> (no longer accepting applications). </>}
          {draftJobs > 0 && <Link href="/admin/careers/jobs?status=DRAFT" className="font-semibold text-green underline">{draftJobs} draft(s)</Link>}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, n, href]) => (
          <Link key={label} href={href} className="flex flex-col gap-2 rounded-2xl bg-white p-4 no-underline ring-1 ring-line hover:ring-green">
            <span className="text-sm font-semibold text-stone">{label}</span>
            <span className="font-serif text-4xl text-forest">{n}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="m-0 text-base font-bold">Applications by position</h2>
          {byJob.length === 0 && speculative === 0 ? (
            <p className="m-0 text-sm text-stone">No applications yet.</p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                {byJob.map((r) => {
                  const j = jobs.find((x) => x.id === r.jobId);
                  return (
                    <tr key={r.jobId} className="border-t border-line first:border-t-0">
                      <td className="py-2 pr-3">
                        <Link href={`/admin/careers/applications?job=${r.jobId}`} className="font-semibold text-green underline">{j?.title ?? "Vacancy"}</Link>
                        <span className="block font-mono text-xs text-stone">{j?.reference}</span>
                      </td>
                      <td className="py-2 text-right font-serif text-xl text-forest">{r._count}</td>
                    </tr>
                  );
                })}
                {speculative > 0 && (
                  <tr className="border-t border-line">
                    <td className="py-2 pr-3"><Link href="/admin/careers/applications?kind=SPECULATIVE" className="font-semibold text-green underline">Future opportunities (profiles)</Link></td>
                    <td className="py-2 text-right font-serif text-xl text-forest">{speculative}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="m-0 text-base font-bold">Latest applications</h2>
          {recent.length === 0 ? (
            <p className="m-0 text-sm text-stone">No applications yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0">
                  <span>
                    <Link href={`/admin/careers/applications/${a.id}`} className="font-semibold text-green underline">{a.fullName}</Link>
                    <span className="block text-xs text-stone">{a.kind === "SPECULATIVE" ? "Future opportunities: " : ""}{a.positionTitle} · {dateTime(a.createdAt)}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${candidateStatusTone[a.status]}`}>{candidateStatusLabels[a.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
