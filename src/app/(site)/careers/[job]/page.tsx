import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPublicJob, isAcceptingApplications, jobPath } from "@/lib/careers";
import { JobDetail } from "@/components/careers/JobDetail";
import { employmentTypeLabels } from "@/content/careers";

export async function generateMetadata({ params }: PageProps<"/careers/[job]">): Promise<Metadata> {
  await connection(); // the vacancy is read per request (it can be closed or edited at any time)
  const { job: param } = await params;
  const job = await getPublicJob(param);
  if (!job) return { title: "Vacancy not found", robots: { index: false } };
  const open = isAcceptingApplications(job);
  const title = job.seoTitle || `${job.title}, ${job.city} (${employmentTypeLabels[job.employmentType]}) | Careers at Vercenji`;
  const description = job.seoDescription || job.shortDescription;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: jobPath(job) },
    // Closed or expired vacancies stay reachable for people with the link, but leave search results.
    robots: open ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: jobPath(job), type: "website", siteName: "Vercenji", images: ["/brand/vercenji-logo-green.png"] },
    twitter: { card: "summary", title, description },
  };
}

export default function JobPage({ params }: PageProps<"/careers/[job]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-[1240px] px-6 py-16 text-stone">Loading…</p>}>
      <JobContent params={params} />
    </Suspense>
  );
}

async function JobContent({ params }: { params: PageProps<"/careers/[job]">["params"] }) {
  await connection();
  const { job: param } = await params;
  const job = await getPublicJob(param);
  if (!job) notFound();
  if (decodeURIComponent(param) !== jobPath(job).slice("/careers/".length)) permanentRedirect(jobPath(job));
  return <JobDetail job={job} />;
}
