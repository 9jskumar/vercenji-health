import Link from "next/link";
import { daysAgo } from "@/lib/time";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { statusLabels, statusTone } from "@/content/admin";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { denied } = await searchParams;
  const canSeeApplications = hasPermission(staff.permissions, PERMISSIONS.applicationsRead);
  const [byStatus, last7] = canSeeApplications
    ? await Promise.all([
        db.partnerApplication.groupBy({ by: ["status"], _count: true }),
        db.partnerApplication.count({ where: { createdAt: { gte: daysAgo(7) } } }),
      ])
    : [[], 0];
  const count = (s: ApplicationStatus) => byStatus.find((r) => r.status === s)?._count ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="m-0 font-serif text-4xl font-normal text-forest">Overview</h1>
      {denied && <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-4 text-sm font-semibold text-[#9B2C2C]">You do not have access to that page.</p>}
      {canSeeApplications && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="m-0 text-lg font-bold text-charcoal">Partner applications</h2>
            <span className="text-sm text-stone">{last7} received in the last 7 days</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {(Object.keys(statusLabels) as ApplicationStatus[]).map((s) => (
              <Link key={s} href={`/admin/applications?status=${s}`} className="flex flex-col gap-2 rounded-2xl bg-white p-4 no-underline ring-1 ring-line hover:ring-green">
                <span className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[s]}`}>{statusLabels[s]}</span>
                <span className="font-serif text-3xl text-forest">{count(s)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <p className="m-0 text-sm text-stone">Customers and content screens arrive in later pull requests.</p>
    </div>
  );
}
