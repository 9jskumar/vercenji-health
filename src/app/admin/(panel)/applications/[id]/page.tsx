import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { assignToMe } from "@/lib/actions/applications";
import { StatusForm } from "@/components/admin/StatusForm";
import { countryLabels, dateTime, modelLabels, statusLabels, statusTone } from "@/content/admin";

const kitchenLabel = (v: boolean | null) => (v === null ? "Not answered" : v ? "Yes" : "Not yet");

export default async function ApplicationDetail({ params }: PageProps<"/admin/applications/[id]">) {
  const staff = await requireStaff(PERMISSIONS.applicationsRead);
  const { id } = await params;
  const app = await db.partnerApplication.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: "asc" } }, notes: { orderBy: { createdAt: "desc" } }, assignee: { select: { name: true, email: true } } },
  });
  if (!app) notFound();
  const authors = await db.user.findMany({ where: { id: { in: [...new Set(app.notes.map((n) => n.authorId))] } }, select: { id: true, name: true, email: true } });
  const authorName = (uid: string) => { const a = authors.find((x) => x.id === uid); return a?.name ?? a?.email ?? "Staff"; };
  const canUpdate = hasPermission(staff.permissions, PERMISSIONS.applicationsUpdate);
  const canDocs = hasPermission(staff.permissions, PERMISSIONS.applicationsDocuments);

  const rows: [string, React.ReactNode][] = [
    ["Model", modelLabels[app.model] + (app.kitchenStructure ? ` · ${app.kitchenStructure}` : "")],
    ["Company", app.companyName ?? "—"],
    ["Email", <a key="e" href={`mailto:${app.email}`} className="text-green underline">{app.email}</a>],
    ["Phone", <a key="p" href={`tel:${app.phone}`} className="text-green underline">{app.phone}</a>],
    ["Location", `${app.city}, ${countryLabels[app.country] ?? app.country}`],
    ["Preferred location", app.proposedLocation ?? "—"],
    ["Investment range", app.investmentRange ?? "—"],
    ["Timeline", app.launchTimeline ?? "—"],
    ["Premises or kitchen", kitchenLabel(app.hasKitchen)],
    ["Consent given", `${dateTime(app.consentAt)} (privacy notice ${app.privacyNoticeVersion})`],
    ["Keep until", dateTime(app.retainUntil)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/applications" className="text-sm font-semibold text-green underline">← All applications</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="m-0 font-serif text-4xl font-normal text-forest">{app.fullName}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone[app.status]}`}>{statusLabels[app.status]}</span>
      </div>
      <p className="m-0 text-sm text-stone">
        <span className="font-mono">{app.reference}</span> · received {dateTime(app.createdAt)} · assigned to{" "}
        {app.assignee ? (app.assignee.name ?? app.assignee.email) : "nobody"}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[200px_1fr]">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-sm font-semibold text-stone">{k}</dt>
                  <dd className="m-0">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          {[["Relevant experience", app.experience], ["Proposal and comments", app.proposal]].map(([title, body]) => (
            <section key={title} className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <h2 className="m-0 mb-2 text-base font-bold">{title}</h2>
              <p className="m-0 whitespace-pre-wrap text-[#45453F]">{body || "—"}</p>
            </section>
          ))}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-3 text-base font-bold">Documents</h2>
            {app.documents.length === 0 ? (
              <p className="m-0 text-stone">No documents were attached.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {app.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{d.originalName} <span className="text-sm text-stone">({Math.ceil(d.sizeBytes / 1024)} KB)</span></span>
                    {canDocs && <a href={`/admin/documents/${d.id}`} className="text-sm font-semibold text-green underline">Download</a>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {canUpdate && (
            <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
              <h2 className="m-0 text-base font-bold">Update</h2>
              <StatusForm id={app.id} status={app.status} />
              {app.assigneeId !== staff.id && (
                <form action={assignToMe}>
                  <input type="hidden" name="id" value={app.id} />
                  <button type="submit" className="text-sm font-semibold text-green underline">Assign to me</button>
                </form>
              )}
            </section>
          )}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="m-0 mb-3 text-base font-bold">History</h2>
            {app.notes.length === 0 ? (
              <p className="m-0 text-sm text-stone">No notes yet.</p>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {app.notes.map((n) => (
                  <li key={n.id} className="flex flex-col gap-1 border-l-2 border-gold pl-3">
                    <span className="text-xs text-stone">{dateTime(n.createdAt)} · {authorName(n.authorId)}</span>
                    {n.statusChange && <span className="text-sm font-semibold">Status → {statusLabels[n.statusChange]}</span>}
                    {n.body && <p className="m-0 text-sm whitespace-pre-wrap">{n.body}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
