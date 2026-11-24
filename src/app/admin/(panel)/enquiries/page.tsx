import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { countryLabels, dateTime } from "@/content/admin";
import { enquiryInterests } from "@/content/ems";
import { setEnquiryStatus } from "@/lib/actions/equipment";
import { EnquiryStatus } from "@/generated/prisma/enums";

const statusText: Record<EnquiryStatus, [string, string]> = {
  NEW: ["New", "bg-[#FBF1DC] text-[#7A5A1E]"],
  CONTACTED: ["Contacted", "bg-[#E3ECF5] text-[#244A6B]"],
  QUOTED: ["Quoted", "bg-[#EDE6F5] text-[#4B2F6B]"],
  WON: ["Won", "bg-[#DCE6DC] text-forest"],
  LOST: ["Lost", "bg-[#EEEEEC] text-stone"],
};
const interestText = Object.fromEntries(enquiryInterests);

export default async function EnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  await requireStaff(PERMISSIONS.applicationsRead);
  const sp = await searchParams;
  const status = Object.values(EnquiryStatus).find((s) => s === sp.status);
  const rows = await db.equipmentEnquiry.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-serif text-4xl font-normal text-forest">EMS enquiries</h1>
          <p className="m-0 text-sm text-stone">Demo and quotation requests from the EMS Wellness page. Each one is also emailed to support.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/enquiries" className={`rounded-full px-3 py-1.5 font-semibold ${!status ? "bg-green text-white" : "bg-white text-green ring-1 ring-line"}`}>All</Link>
          {Object.values(EnquiryStatus).map((s) => (
            <Link key={s} href={`/admin/enquiries?status=${s}`} className={`rounded-full px-3 py-1.5 font-semibold ${status === s ? "bg-green text-white" : "bg-white text-green ring-1 ring-line"}`}>{statusText[s][0]}</Link>
          ))}
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((r) => (
          <li key={r.id} id={r.id} className="flex scroll-mt-6 flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <strong className="text-forest">{r.name}{r.company && <span className="font-normal text-stone"> · {r.company}</span>}</strong>
                <span className="text-sm text-stone">{dateTime(r.createdAt)} · {interestText[r.interest] ?? r.interest} · {[r.city, countryLabels[r.country] ?? r.country].filter(Boolean).join(", ")}</span>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusText[r.status][1]}`}>{statusText[r.status][0]}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <a href={`mailto:${r.email}`} className="font-semibold text-green underline">{r.email}</a>
              <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="font-semibold text-green underline">{r.phone}</a>
            </div>
            {r.message && <p className="m-0 rounded-xl bg-ivory p-3 text-sm whitespace-pre-wrap text-[#45453F]">{r.message}</p>}
            <form action={setEnquiryStatus} className="flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="id" value={r.id} />
              <label className="flex items-center gap-2 font-semibold">Status
                <select name="status" defaultValue={r.status} className="field py-1.5 font-normal">
                  {Object.values(EnquiryStatus).map((s) => <option key={s} value={s}>{statusText[s][0]}</option>)}
                </select>
              </label>
              <button type="submit" className="btn-ghost py-1.5">Update</button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-stone ring-1 ring-line">No enquiries yet.</li>}
      </ul>
    </div>
  );
}
