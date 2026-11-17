import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { JobForm } from "@/components/admin/careers/JobForm";

export default async function NewJob() {
  await requireStaff(PERMISSIONS.careersManage);
  const departments = await db.jobDepartment.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, group: true, isActive: true } });
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/careers/jobs" className="text-sm font-semibold text-green underline">← All vacancies</Link>
      <h1 className="m-0 font-serif text-4xl font-normal text-forest">New vacancy</h1>
      <p className="m-0 text-stone">Save it as a draft to preview it first, or publish it straight away. Only publish real, approved openings.</p>
      <JobForm
        departments={departments}
        values={{
          title: "", departmentIds: [], employmentType: "", workArrangement: "", experienceLevel: "", experienceText: "", education: "",
          city: "", state: "", openings: 1, salaryMin: "", salaryMax: "", salaryPeriod: "YEAR", showSalary: false, compensationNote: "",
          shortDescription: "", summary: "", responsibilities: "", skills: "", preferred: "", deadline: "", isUrgent: false, isFeatured: false,
          seoTitle: "", seoDescription: "",
        }}
      />
    </div>
  );
}
