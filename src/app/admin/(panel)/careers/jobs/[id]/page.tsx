import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getJobForStaff, indiaDateString, isExpired, jobPath } from "@/lib/careers";
import { JobForm } from "@/components/admin/careers/JobForm";
import { JobActions } from "@/components/admin/careers/JobActions";
import { dateTime } from "@/content/admin";
import { jobStatusLabels, jobStatusTone } from "@/content/careers";

const savedMessages: Record<string, string> = {
  published: "Saved and published. It is now live on the careers page.",
  saved: "Saved.",
  duplicated: "Copy created as a draft. Edit the details, then publish.",
};

export default async function EditJob({ params, searchParams }: PageProps<"/admin/careers/jobs/[id]">) {
  await requireStaff(PERMISSIONS.careersManage);
  await connection();
  const { id } = await params;
  const sp = await searchParams;
  const job = await getJobForStaff(id);
  if (!job) notFound();
  const [departments, applications] = await Promise.all([
    db.jobDepartment.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, group: true, isActive: true } }),
    db.jobApplication.count({ where: { jobId: job.id } }),
  ]);
  const expired = job.status === "PUBLISHED" && isExpired(job);
  const saved = typeof sp.saved === "string" ? savedMessages[sp.saved] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/careers/jobs" className="text-sm font-semibold text-green underline">← All vacancies</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">{job.title}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${jobStatusTone[expired ? "EXPIRED" : job.status]}`}>{expired ? "Past deadline" : jobStatusLabels[job.status]}</span>
      </div>
      <p className="m-0 text-sm text-stone">
        <span className="font-mono">{job.reference}</span> · created {dateTime(job.createdAt)} · updated {dateTime(job.updatedAt)}
        {job.publishedAt && <> · first published {dateTime(job.publishedAt)}</>}
        {job.closedAt && job.status === "CLOSED" && <> · closed {dateTime(job.closedAt)}</>}
      </p>
      {saved && <p role="status" className="m-0 rounded-xl bg-[#DCE6DC] p-4 text-sm font-semibold text-forest">{saved}</p>}

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-base font-bold">Status and actions</h2>
          <span className="flex flex-wrap gap-4 text-sm">
            <Link href={`/admin/careers/jobs/${job.id}/preview`} target="_blank" className="font-semibold text-green underline">Preview</Link>
            {job.status === "PUBLISHED" && <Link href={jobPath(job)} target="_blank" className="font-semibold text-green underline">View live page</Link>}
            <Link href={`/admin/careers/applications?job=${job.id}`} className="font-semibold text-green underline">{applications} application(s)</Link>
          </span>
        </div>
        <JobActions id={job.id} status={job.status} applications={applications} />
      </section>

      <JobForm
        departments={departments}
        values={{
          id: job.id,
          status: job.status,
          title: job.title,
          departmentIds: job.departments.map((d) => d.departmentId),
          employmentType: job.employmentType,
          workArrangement: job.workArrangement,
          experienceLevel: job.experienceLevel,
          experienceText: job.experienceText,
          education: job.education,
          city: job.city,
          state: job.state,
          openings: job.openings,
          salaryMin: job.salaryMin?.toString() ?? "",
          salaryMax: job.salaryMax?.toString() ?? "",
          salaryPeriod: job.salaryPeriod ?? "YEAR",
          showSalary: job.showSalary,
          compensationNote: job.compensationNote ?? "",
          shortDescription: job.shortDescription,
          summary: job.summary,
          responsibilities: job.responsibilities,
          skills: job.skills,
          preferred: job.preferred ?? "",
          deadline: job.deadline ? indiaDateString(job.deadline) : "",
          isUrgent: job.isUrgent,
          isFeatured: job.isFeatured,
          seoTitle: job.seoTitle ?? "",
          seoDescription: job.seoDescription ?? "",
        }}
      />
    </div>
  );
}
