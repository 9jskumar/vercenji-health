import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { countryLabels, dateTime, modelLabels, statusLabels, statusTone } from "@/content/admin";
import { ApplicationStatus, PartnerModel } from "@/generated/prisma/enums";

const PAGE_SIZE = 25;

export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  await requireStaff(PERMISSIONS.applicationsRead);
  const sp = await searchParams;
  const status = Object.values(ApplicationStatus).find((s) => s === sp.status);
  const model = Object.values(PartnerModel).find((m) => m === sp.model);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...(status && { status }),
    ...(model && { model }),
    ...(q && {
      OR: [
        { reference: { contains: q } },
        { fullName: { contains: q } },
        { companyName: { contains: q } },
        { email: { contains: q } },
        { city: { contains: q } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    db.partnerApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, reference: true, fullName: true, companyName: true, city: true, country: true, model: true, status: true, createdAt: true, _count: { select: { documents: true } } },
    }),
    db.partnerApplication.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (status) u.set("status", status);
    if (model) u.set("model", model);
    if (q) u.set("q", q);
    u.set("page", String(p));
    return `?${u}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">Partner applications</h1>
        <span className="text-sm text-stone">{total} found</span>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-line" role="search">
        <label className="flex flex-[1_1_220px] flex-col gap-1 text-sm font-semibold">
          Search
          <input name="q" defaultValue={q} placeholder="Name, company, email, city or reference" className="field py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Status
          <select name="status" defaultValue={status ?? ""} className="field py-2">
            <option value="">All statuses</option>
            {Object.values(ApplicationStatus).map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Model
          <select name="model" defaultValue={model ?? ""} className="field py-2">
            <option value="">All models</option>
            {Object.values(PartnerModel).map((m) => <option key={m} value={m}>{modelLabels[m]}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary py-2.5">Filter</button>
        {(status || model || q) && <Link href="/admin/applications" className="py-2.5 text-sm font-semibold text-green underline">Clear</Link>}
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-ivory text-xs tracking-wide text-stone uppercase">
            <tr>
              <th className="p-3">Received</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Applicant</th>
              <th className="p-3">Model</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line hover:bg-ivory/60">
                <td className="p-3 whitespace-nowrap text-stone">{dateTime(r.createdAt)}</td>
                <td className="p-3 font-mono">
                  <Link href={`/admin/applications/${r.id}`} className="font-semibold text-green underline">{r.reference}</Link>
                </td>
                <td className="p-3">
                  {r.fullName}
                  {r.companyName && <span className="block text-stone">{r.companyName}</span>}
                  {r._count.documents > 0 && <span className="block text-xs text-stone">{r._count.documents} document(s)</span>}
                </td>
                <td className="p-3">{modelLabels[r.model]}</td>
                <td className="p-3">{r.city}, {countryLabels[r.country] ?? r.country}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusTone[r.status]}`}>{statusLabels[r.status]}</span></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-stone">No applications match these filters.</td></tr>
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
