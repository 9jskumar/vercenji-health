import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getRecruitmentSettings } from "@/lib/careers";
import { DepartmentForm, RecruitmentSettingsForm, TemplateForm } from "@/components/admin/careers/SettingsForms";
import { templatePlaceholders } from "@/content/careers";

export default async function CareersSettings() {
  await requireStaff(PERMISSIONS.careersManage);
  await connection();
  const [settings, templates, departments] = await Promise.all([
    getRecruitmentSettings(),
    db.recruitmentEmailTemplate.findMany({ orderBy: { name: "asc" } }),
    db.jobDepartment.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  return (
    <div className="flex flex-col gap-8">
      <h1 className="m-0 font-serif text-4xl font-normal text-forest">Recruitment settings</h1>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Notifications and data</h2>
        <RecruitmentSettingsForm {...settings} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-base font-bold">Email templates</h2>
          <p className="m-0 text-sm text-stone">
            Used for the automatic acknowledgement and for emails you send from a candidate&apos;s page. Placeholders:{" "}
            {templatePlaceholders.map(([k, v], i) => (
              <span key={k}>{i > 0 && "; "}<code className="rounded bg-white px-1">{k}</code> {v.toLowerCase()}</span>
            ))}
            .
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {templates.map((t) => <TemplateForm key={t.key} tpl={t} />)}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-base font-bold">Departments (job categories)</h2>
          <p className="m-0 text-sm text-stone">Shown as categories and filters on the careers page. Untick “Shown” to hide one without changing existing vacancies.</p>
        </div>
        <div className="flex flex-col gap-4">
          {departments.map((d) => <DepartmentForm key={d.id} dept={d} />)}
          <div className="border-t border-line pt-4"><DepartmentForm /></div>
        </div>
      </section>
    </div>
  );
}
