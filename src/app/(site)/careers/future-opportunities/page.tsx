import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { issueFormToken } from "@/lib/form-token";
import { ApplicationForm } from "@/components/careers/ApplicationForm";
import { careersCopy } from "@/content/careers";

export const metadata: Metadata = {
  title: { absolute: "Submit Your Profile for Future Opportunities | Careers at Vercenji" },
  description: "Share your CV with Vercenji and tell us where you would like to contribute. We may contact you when a suitable opportunity becomes available.",
  alternates: { canonical: "/careers/future-opportunities" },
};

export default function FutureOpportunitiesPage() {
  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-stone">
          <Link href="/careers" className="text-green">Careers</Link> / Future opportunities
        </nav>
        <div className="eyebrow">Careers</div>
        <h1 className="m-0 font-serif text-[clamp(32px,4vw,48px)] leading-tight font-normal text-forest">{careersCopy.speculativeTitle}</h1>
        <p className="m-0 max-w-[700px] leading-relaxed text-[#45453F]">
          We are always interested in connecting with talented and passionate people. Share your CV and the kind of role you are looking
          for. This is separate from applying to a specific vacancy: if a matching position opens, our recruitment team may contact you.
          You can also <Link href="/careers#openings" className="text-green underline">browse current openings</Link>.
        </p>
      </div>
      <div className="rounded-[28px] bg-white p-6 ring-1 ring-line sm:p-10">
        <Suspense fallback={<p className="text-stone">Loading the form…</p>}>
          <SpeculativeForm />
        </Suspense>
      </div>
    </div>
  );
}

async function SpeculativeForm() {
  await connection();
  const departments = await db.jobDepartment.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { name: true } });
  return <ApplicationForm kind="SPECULATIVE" formToken={issueFormToken("careers-apply")} departments={departments.map((d) => d.name)} />;
}
