import Link from "next/link";
import type { JobCardData } from "@/lib/careers";
import { jobPath } from "@/lib/careers";
import { dateOnly, employmentTypeLabels, formatSalary, workArrangementLabels } from "@/content/careers";
import { MetaIcon } from "./CareersIcons";

export function JobCard({ job }: { job: JobCardData }) {
  const href = jobPath(job);
  const salary = job.showSalary ? formatSalary(job) : null;
  return (
    <article className="card-lift flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        {job.isFeatured && <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-gold-light">Featured</span>}
        {job.isUrgent && <span className="rounded-full bg-[#FBEAEA] px-2.5 py-1 text-xs font-semibold text-[#9B2C2C]">Urgent hiring</span>}
        {job.departments.map((d) => (
          <span key={d.department.slug} className="rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-green">{d.department.name}</span>
        ))}
      </div>
      <h3 className="m-0 font-serif text-2xl leading-tight font-normal text-forest">
        <Link href={href} className="text-forest no-underline hover:underline">{job.title}</Link>
      </h3>
      <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-2 p-0 text-sm text-[#45453F] sm:grid-cols-2">
        <li className="flex items-center gap-2"><MetaIcon name="pin" />{job.city}, {job.state} · {workArrangementLabels[job.workArrangement]}</li>
        <li className="flex items-center gap-2"><MetaIcon name="briefcase" />{employmentTypeLabels[job.employmentType]}</li>
        <li className="flex items-center gap-2"><MetaIcon name="clock" />{job.experienceText}</li>
        <li className="flex items-center gap-2"><MetaIcon name="cap" />{job.education}</li>
        {salary && <li className="flex items-center gap-2"><MetaIcon name="rupee" />{salary}</li>}
      </ul>
      <p className="m-0 leading-relaxed text-[#45453F]">{job.shortDescription}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <span className="flex flex-col text-xs text-stone">
          {job.publishedAt && <span>Posted {dateOnly(job.publishedAt)}</span>}
          <span>{job.deadline ? `Apply by ${dateOnly(job.deadline)}` : "Open until filled"}</span>
        </span>
        <span className="flex flex-wrap gap-2">
          <Link href={href} className="btn-ghost px-5 py-2.5 text-sm" aria-label={`View details: ${job.title}`}>View details</Link>
          <Link href={`${href}/apply`} className="btn-primary px-5 py-2.5 text-sm" aria-label={`Apply now: ${job.title}`}>Apply Now</Link>
        </span>
      </div>
    </article>
  );
}
