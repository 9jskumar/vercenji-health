import Link from "next/link";
import type { JobDetailData } from "@/lib/careers";
import { isAcceptingApplications, isExpired, jobPath, siteUrl } from "@/lib/careers";
import { company } from "@/lib/site";
import {
  dateOnly,
  employmentTypeLabels,
  experienceLevelLabels,
  formatSalary,
  lines,
  workArrangementLabels,
} from "@/content/careers";
import { MetaIcon } from "./CareersIcons";
import { ShareJob } from "./ShareJob";

const schemaEmploymentType = { FULL_TIME: "FULL_TIME", PART_TIME: "PART_TIME", CONTRACT: "CONTRACTOR", INTERNSHIP: "INTERN" } as const;

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** JobPosting structured data, built only from what the vacancy itself says. */
function jobPostingJsonLd(job: JobDetailData) {
  const list = (title: string, items: string[]) => (items.length ? `<p><strong>${title}</strong></p><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
  const description = [
    `<p>${esc(job.summary).replace(/\n+/g, "</p><p>")}</p>`,
    list("Key responsibilities", lines(job.responsibilities)),
    list("Required skills and competencies", lines(job.skills)),
    list("Preferred qualifications", lines(job.preferred)),
    `<p><strong>Experience:</strong> ${esc(job.experienceText)}</p>`,
    `<p><strong>Education:</strong> ${esc(job.education)}</p>`,
  ].join("");
  const salary =
    job.showSalary && (job.salaryMin || job.salaryMax)
      ? {
          "@type": "MonetaryAmount",
          currency: "INR",
          value: {
            "@type": "QuantitativeValue",
            ...(job.salaryMin && job.salaryMax ? { minValue: job.salaryMin, maxValue: job.salaryMax } : { value: job.salaryMin ?? job.salaryMax }),
            unitText: job.salaryPeriod === "MONTH" ? "MONTH" : "YEAR",
          },
        }
      : undefined;
  const place = {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressLocality: job.city, addressRegion: job.state, addressCountry: job.country },
  };
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description,
    identifier: { "@type": "PropertyValue", name: company.brand, value: job.reference },
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    ...(job.deadline && { validThrough: job.deadline.toISOString() }),
    employmentType: schemaEmploymentType[job.employmentType],
    hiringOrganization: { "@type": "Organization", name: company.brand, legalName: company.legalName, sameAs: siteUrl(), logo: `${siteUrl()}/brand/vercenji-logo-green.png` },
    ...(job.workArrangement === "REMOTE"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: job.country === "IN" ? "India" : job.country } }
      : { jobLocation: place }),
    ...(salary && { baseSalary: salary }),
    educationRequirements: job.education,
    experienceRequirements: job.experienceText,
    industry: "Health and wellness",
    occupationalCategory: job.departments.map((d) => d.department.name).join(", "),
    totalJobOpenings: job.openings,
    directApply: true,
    url: `${siteUrl()}${jobPath(job)}`,
  };
}

export function JobDetail({ job, preview = false }: { job: JobDetailData; preview?: boolean }) {
  // A preview shows the page as it will look once published.
  const open = preview ? !isExpired(job) : isAcceptingApplications(job);
  const href = jobPath(job);
  const salary = job.showSalary ? formatSalary(job) : null;
  const sections: [string, string[]][] = [
    ["Key responsibilities", lines(job.responsibilities)],
    ["Required skills and competencies", lines(job.skills)],
    ["Preferred qualifications", lines(job.preferred)],
  ];
  const facts: [Parameters<typeof MetaIcon>[0]["name"], string, string][] = [
    ["building", "Department", job.departments.map((d) => d.department.name).join(", ")],
    ["pin", "Location", `${job.city}, ${job.state} · ${workArrangementLabels[job.workArrangement]}`],
    ["briefcase", "Employment type", employmentTypeLabels[job.employmentType] + (job.openings > 1 ? ` · ${job.openings} openings` : "")],
    ["clock", "Experience", `${job.experienceText} (${experienceLevelLabels[job.experienceLevel]})`],
    ["cap", "Qualification", job.education],
    ["calendar", "Date posted", job.publishedAt ? dateOnly(job.publishedAt) : "Not yet published"],
    ["calendar", "Application deadline", job.deadline ? dateOnly(job.deadline) : "Open until filled"],
  ];
  const apply = !open ? null : preview ? (
    <span className="btn-primary w-full cursor-default opacity-70">Apply Now (works once published)</span>
  ) : (
    <Link href={`${href}/apply`} className="btn-primary w-full">Apply Now</Link>
  );

  return (
    <>
      {!preview && open && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)).replace(/</g, "\\u003c") }} />
      )}
      <section className="bg-forest text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-[#CFC8B8]">
            <Link href="/" className="text-ivory">Home</Link> / <Link href="/careers" className="text-ivory">Careers</Link> / {job.title}
          </nav>
          <div className="flex flex-wrap gap-2">
            {job.isUrgent && open && <span className="rounded-full bg-[#FBEAEA] px-2.5 py-1 text-xs font-semibold text-[#9B2C2C]">Urgent hiring</span>}
            {job.departments.map((d) => (
              <span key={d.department.slug} className="rounded-full border border-forest-line px-2.5 py-1 text-xs font-semibold text-gold-light">{d.department.name}</span>
            ))}
          </div>
          <h1 className="m-0 font-serif text-[clamp(34px,4.5vw,56px)] leading-[1.08] font-normal">{job.title}</h1>
          <p className="m-0 flex flex-wrap gap-x-5 gap-y-1 text-[#DCE6DC]">
            <span>Ref. <span className="font-mono">{job.reference}</span></span>
            <span>{job.city}, {job.state}</span>
            <span>{employmentTypeLabels[job.employmentType]}</span>
            <span>{workArrangementLabels[job.workArrangement]}</span>
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-10 px-4 py-12 sm:px-6">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-8">
          {!open && (
            <div role="status" className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-6">
              <strong className="font-serif text-xl font-normal text-forest">This position is no longer accepting applications.</strong>
              <span className="text-stone">
                See our <Link href="/careers#openings" className="text-green underline">current openings</Link>, or{" "}
                <Link href="/careers/future-opportunities" className="text-green underline">submit your profile for future opportunities</Link>.
              </span>
            </div>
          )}
          <section className="flex flex-col gap-3">
            <h2 className="m-0 font-serif text-[28px] font-normal text-forest">Job summary</h2>
            {job.summary.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="m-0 leading-relaxed whitespace-pre-line text-[#45453F]">{p}</p>
            ))}
          </section>
          {sections.map(([title, items]) =>
            items.length ? (
              <section key={title} className="flex flex-col gap-3">
                <h2 className="m-0 font-serif text-[28px] font-normal text-forest">{title}</h2>
                <ul className="m-0 flex flex-col gap-2 pl-5 leading-relaxed text-[#45453F] marker:text-gold">
                  {items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </section>
            ) : null,
          )}
          <section className="flex flex-col gap-3">
            <h2 className="m-0 font-serif text-[28px] font-normal text-forest">Experience and qualifications</h2>
            <p className="m-0 leading-relaxed text-[#45453F]"><strong>Experience:</strong> {job.experienceText}</p>
            <p className="m-0 leading-relaxed text-[#45453F]"><strong>Education:</strong> {job.education}</p>
          </section>
          {(salary || job.compensationNote) && (
            <section className="flex flex-col gap-3">
              <h2 className="m-0 font-serif text-[28px] font-normal text-forest">Compensation</h2>
              {salary && <p className="m-0 font-semibold text-[#45453F]">{salary}</p>}
              {job.compensationNote && <p className="m-0 leading-relaxed whitespace-pre-line text-[#45453F]">{job.compensationNote}</p>}
            </section>
          )}
          {open && <div className="sm:hidden">{apply}</div>}
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-6 self-start lg:sticky lg:top-6 lg:max-w-[380px]">
          <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 ring-1 ring-line">
            <dl className="m-0 flex flex-col gap-3.5">
              {facts.map(([icon, k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="pt-0.5"><MetaIcon name={icon} /></span>
                  <div className="flex flex-col">
                    <dt className="text-xs font-bold tracking-[0.1em] text-stone uppercase">{k}</dt>
                    <dd className="m-0 text-[15px] text-charcoal">{v}</dd>
                  </div>
                </div>
              ))}
              {salary && (
                <div className="flex gap-3">
                  <span className="pt-0.5"><MetaIcon name="rupee" /></span>
                  <div className="flex flex-col">
                    <dt className="text-xs font-bold tracking-[0.1em] text-stone uppercase">Salary</dt>
                    <dd className="m-0 text-[15px] text-charcoal">{salary}</dd>
                  </div>
                </div>
              )}
            </dl>
            {apply}
          </div>
          {!preview && <ShareJob url={`${siteUrl()}${href}`} title={job.title} />}
        </aside>
      </div>
    </>
  );
}
