import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPublicJob, isAcceptingApplications, jobPath } from "@/lib/careers";
import { issueFormToken } from "@/lib/form-token";
import { ApplicationForm } from "@/components/careers/ApplicationForm";
import { employmentTypeLabels, workArrangementLabels } from "@/content/careers";

export const metadata: Metadata = { title: "Apply", robots: { index: false, follow: true } };

export default function ApplyPage({ params }: PageProps<"/careers/[job]/apply">) {
  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-8 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-stone">Loading the application form…</p>}>
        <ApplyContent params={params} />
      </Suspense>
    </div>
  );
}

async function ApplyContent({ params }: { params: PageProps<"/careers/[job]/apply">["params"] }) {
  await connection();
  const { job: param } = await params;
  const job = await getPublicJob(param);
  if (!job) notFound();
  const canonical = jobPath(job);
  if (decodeURIComponent(param) !== canonical.slice("/careers/".length)) permanentRedirect(`${canonical}/apply`);
  const open = isAcceptingApplications(job);
  return (
    <>
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-stone">
          <Link href="/careers" className="text-green">Careers</Link> / <Link href={canonical} className="text-green">{job.title}</Link> / Apply
        </nav>
        <div className="eyebrow">Job application</div>
        <h1 className="m-0 font-serif text-[clamp(32px,4vw,48px)] leading-tight font-normal text-forest">{job.title}</h1>
        <p className="m-0 text-stone">
          Ref. <span className="font-mono">{job.reference}</span> · {job.city}, {job.state} · {employmentTypeLabels[job.employmentType]} ·{" "}
          {workArrangementLabels[job.workArrangement]}
        </p>
      </div>
      <div className="rounded-[28px] bg-white p-6 ring-1 ring-line sm:p-10">
        {open ? (
          <ApplicationForm kind="VACANCY" formToken={issueFormToken("careers-apply")} job={{ id: job.id, title: job.title, reference: job.reference }} />
        ) : (
          <div role="status" className="flex flex-col gap-3">
            <strong className="font-serif text-2xl font-normal text-forest">This position is no longer accepting applications.</strong>
            <span className="text-stone">
              See our <Link href="/careers#openings" className="text-green underline">current openings</Link>, or{" "}
              <Link href="/careers/future-opportunities" className="text-green underline">submit your profile for future opportunities</Link>.
            </span>
          </div>
        )}
      </div>
    </>
  );
}
