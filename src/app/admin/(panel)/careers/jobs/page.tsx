import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { closeExpiredJobs } from "@/lib/actions/careers-admin";
import { isExpired, jobPath } from "@/lib/careers";
import { dateOnly, employmentTypeLabels, jobStatusLabels, jobStatusTone } from "@/content/careers";
import { JobStatus } from "@/generated/prisma/enums";

export default async function JobsPage({ searchParams }: PageProps<"/admin/careers/jobs">) {
  await requireStaff(PERMISSIONS.careersManage);
  await connection();
  const sp = await searchParams;
  const now = new Date();
  const statusParam = typeof sp.status === "string" ? sp.status : "";
  const status = Object.values(JobStatus).find((s) => s === statusParam);
  const expiredOnly = statusParam === "EXPIRED";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const where: Prisma.JobVacancyWhereInput = {
    ...(status && { status }),
    ...(expiredOnly && { status: "PUBLISHED", deadline: { lt: now } }),
    ...(q && { OR: [{ title: { contains: q } }, { reference: { contains: q } }, { city: { contains: q } }] }),
  };
  const [jobs, expiredCount] = await Promise.all([
    db.jobVacancy.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
      include: { departments: { include: { department: { select: { name: true } } } }, _count: { select: { applications: true } } },
    }),
    db.jobVacancy.count({ where: { status: "PUBLISHED", deadline: { lt: now } } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Vacancies</h1>
        <Link href="/admin/careers/jobs/new" className="btn-primary px-5 py-2.5 text-sm">New vacancy</Link>
      </div>
      {sp.deleted && <p role="status" className="m-0 text-sm font-semibold text-green">Vacancy deleted.</p>}
      {typeof sp.closed === "string" && <p role="status" className="m-0 text-sm font-semibold text-green">{sp.closed} expired vacancy(ies) closed.</p>}
      {expiredCount > 0 && (
        <form action={closeExpiredJobs} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#FBF1DC] p-4 text-sm text-[#7A5A1E]">
          <span className="font-semibold">{expiredCount} published vacancy(ies) are past their deadline and no longer accept applications.</span>
          <button type="submit" className="btn-ghost px-4 py-2 text-sm">Close all expired</button>
        </form>
      )}

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-line" role="search">
        <label className="flex flex-[1_1_220px] flex-col gap-1 text-sm font-semibold">
          Search
          <input name="q" defaultValue={q} placeholder="Title, reference or city" className="field py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Status
          <select name="status" defaultValue={statusParam} className="field py-2">
            <option value="">All</option>
            {Object.values(JobStatus).map((s) => <option key={s} value={s}>{jobStatusLabels[s]}</option>)}
            <option value="EXPIRED">Past deadline</option>
          </select>
        </label>
        <button type="submit" className="btn-primary py-2.5">Filter</button>
        {(statusParam || q) && <Link href="/admin/careers/jobs" className="py-2.5 text-sm font-semibold text-green underline">Clear</Link>}
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-ivory text-xs tracking-wide text-stone uppercase">
            <tr>
              <th className="p-3">Vacancy</th>
              <th className="p-3">Department</th>
              <th className="p-3">Type and location</th>
              <th className="p-3">Deadline</th>
              <th className="p-3">Applications</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const expired = j.status === "PUBLISHED" && isExpired(j, now);
              return (
                <tr key={j.id} className="border-t border-line align-top hover:bg-ivory/60">
                  <td className="p-3">
                    <Link href={`/admin/careers/jobs/${j.id}`} className="font-semibold text-green underline">{j.title}</Link>
                    <span className="block font-mono text-xs text-stone">{j.reference}</span>
                    <span className="flex gap-2 pt-1 text-xs">
                      {j.isFeatured && <span className="font-semibold text-gold-deep">Featured</span>}
                      {j.isUrgent && <span className="font-semibold text-[#9B2C2C]">Urgent</span>}
                      {j.status === "PUBLISHED" && <Link href={jobPath(j)} target="_blank" className="text-green underline">View live</Link>}
                    </span>
                  </td>
                  <td className="p-3">{j.departments.map((d) => d.department.name).join(", ")}</td>
                  <td className="p-3">{employmentTypeLabels[j.employmentType]}<span className="block text-stone">{j.city}, {j.state}</span></td>
                  <td className="p-3 whitespace-nowrap">{j.deadline ? dateOnly(j.deadline) : "—"}</td>
                  <td className="p-3">
                    <Link href={`/admin/careers/applications?job=${j.id}`} className="font-semibold text-green underline">{j._count.applications}</Link>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${jobStatusTone[expired ? "EXPIRED" : j.status]}`}>
                      {expired ? "Past deadline" : jobStatusLabels[j.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-stone">{statusParam || q ? "No vacancies match these filters." : "No vacancies yet. Create the first one with “New vacancy”."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
