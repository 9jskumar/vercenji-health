import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { dateTime } from "@/content/admin";
import { candidateStatusLabels, candidateStatusTone, experienceOptions } from "@/content/careers";
import { CandidateStatus } from "@/generated/prisma/enums";
import { candidateQuery, SORTS } from "@/lib/candidate-query";

const PAGE_SIZE = 25;

export default async function CandidatesPage({ searchParams }: PageProps<"/admin/careers/applications">) {
  const staff = await requireStaff(PERMISSIONS.careersApplications);
  await connection();
  const sp = await searchParams;
  const { where, orderBy, filters } = candidateQuery(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const [rows, total, jobs] = await Promise.all([
    db.jobApplication.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { documents: { select: { id: true }, take: 1 } },
    }),
    db.jobApplication.count({ where }),
    db.jobVacancy.findMany({ where: { applications: { some: {} } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, reference: true } }),
  ]);
  const canCv = hasPermission(staff.permissions, PERMISSIONS.careersCvs);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v && !(k === "sort" && v === "newest")) params.set(k, String(v));
  const qs = (p: number) => `?${new URLSearchParams([...params, ["page", String(p)]])}`;
  const filtered = [...params.keys()].length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Candidates</h1>
        <span className="flex items-center gap-4 text-sm text-stone">
          {total} found
          {canCv && total > 0 && (
            <a href={`/admin/careers/applications/export?${params}`} className="btn-ghost px-4 py-2 text-sm">Export CSV (Excel)</a>
          )}
        </span>
      </div>
      {typeof sp.deleted === "string" && <p role="status" className="m-0 text-sm font-semibold text-green">Application {sp.deleted} and its CV were deleted.</p>}

      <form className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4" role="search">
        <label className="flex flex-col gap-1 text-sm font-semibold lg:col-span-2">
          Search
          <input name="q" defaultValue={filters.q} placeholder="Name, email, phone, position, employer or reference" className="field py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Position
          <select name="job" defaultValue={filters.job ?? ""} className="field py-2">
            <option value="">All positions</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} ({j.reference})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Type
          <select name="kind" defaultValue={filters.kind ?? ""} className="field py-2">
            <option value="">Vacancies and profiles</option>
            <option value="VACANCY">Applied to a vacancy</option>
            <option value="SPECULATIVE">Future-opportunity profiles</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className="field py-2">
            <option value="">All statuses</option>
            {Object.values(CandidateStatus).map((s) => <option key={s} value={s}>{candidateStatusLabels[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Experience
          <select name="experience" defaultValue={filters.experience} className="field py-2">
            <option value="">Any</option>
            {experienceOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Location contains
          <input name="location" defaultValue={filters.location} className="field py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Sort
          <select name="sort" defaultValue={filters.sort} className="field py-2">
            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-4 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn-primary py-2.5">Apply filters</button>
          {filtered && <Link href="/admin/careers/applications" className="py-2.5 text-sm font-semibold text-green underline">Clear</Link>}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="bg-ivory text-xs tracking-wide text-stone uppercase">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Candidate</th>
              <th className="p-3">Position</th>
              <th className="p-3">Applied</th>
              <th className="p-3">Experience</th>
              <th className="p-3">Location</th>
              <th className="p-3">CV</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top hover:bg-ivory/60">
                <td className="p-3 font-mono whitespace-nowrap">
                  <Link href={`/admin/careers/applications/${r.id}`} className="font-semibold text-green underline">{r.reference}</Link>
                </td>
                <td className="p-3">
                  <Link href={`/admin/careers/applications/${r.id}`} className="font-semibold text-charcoal no-underline hover:underline">{r.fullName}</Link>
                  <span className="block text-stone">{r.email}</span>
                  <span className="block text-stone">{r.phone}</span>
                </td>
                <td className="p-3">
                  {r.kind === "SPECULATIVE" && <span className="block text-xs font-semibold text-gold-deep">Future opportunities</span>}
                  {r.positionTitle}
                </td>
                <td className="p-3 whitespace-nowrap text-stone">{dateTime(r.createdAt)}</td>
                <td className="p-3">{r.totalExperience}</td>
                <td className="p-3">{r.currentLocation}</td>
                <td className="p-3">
                  {r.documents[0] && canCv ? <a href={`/admin/careers/cv/${r.documents[0].id}`} className="font-semibold text-green underline">Download</a> : r.documents[0] ? "Attached" : "—"}
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${candidateStatusTone[r.status]}`}>{candidateStatusLabels[r.status]}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-stone">{filtered ? "No candidates match these filters." : "No applications yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
          {page > 1 && <Link href={qs(page - 1)} className="font-semibold text-green underline">Previous</Link>}
          <span className="text-stone">Page {page} of {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="font-semibold text-green underline">Next</Link>}
        </nav>
      )}
    </div>
  );
}
