import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getJobForStaff } from "@/lib/careers";
import { JobDetail } from "@/components/careers/JobDetail";
import { jobStatusLabels } from "@/content/careers";

// Shows a vacancy exactly as the public page will, for staff only (drafts included).
export default async function PreviewJob({ params }: PageProps<"/admin/careers/jobs/[id]/preview">) {
  await requireStaff(PERMISSIONS.careersManage);
  const { id } = await params;
  const job = await getJobForStaff(id);
  if (!job) notFound();
  return (
    <div className="-mx-6 -my-10 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF1DC] px-6 py-3 text-sm font-semibold text-[#7A5A1E]">
        <span>Preview ({jobStatusLabels[job.status]}). Visitors cannot see this page until the vacancy is published.</span>
        <Link href={`/admin/careers/jobs/${job.id}`} className="text-[#7A5A1E] underline">Back to editing</Link>
      </div>
      <div className="bg-ivory">
        <JobDetail job={job} preview />
      </div>
    </div>
  );
}
