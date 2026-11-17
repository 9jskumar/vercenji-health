import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { clientIp } from "@/lib/request";
import { candidateQuery } from "@/lib/candidate-query";
import { candidateStatusLabels } from "@/content/careers";

// CSV of the candidates matching the current filters. Opens in Excel (UTF-8 with BOM).
// Cells that start with = + - @ are prefixed with ' so spreadsheets do not run them as formulas.
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString().replace("T", " ").slice(0, 16) + " UTC" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const staff = await getStaff();
  if (!staff) return new Response("Not signed in", { status: 401 });
  if (!hasPermission(staff.permissions, PERMISSIONS.careersCvs)) return new Response("Forbidden", { status: 403 });

  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { where, orderBy } = candidateQuery(sp);
  const rows = await db.jobApplication.findMany({ where, orderBy, take: 5000, include: { job: { select: { reference: true } } } });
  const header = [
    "Reference", "Applied (UTC)", "Type", "Position", "Vacancy reference", "Area of interest", "Full name", "Email", "Mobile", "Current location",
    "Total experience", "Employment status", "Highest qualification", "Current/previous employer", "LinkedIn", "Expected salary",
    "Notice period", "Status", "Keep until (UTC)",
  ];
  const lines = rows.map((r) =>
    [
      r.reference, r.createdAt, r.kind === "SPECULATIVE" ? "Future opportunities" : "Vacancy", r.positionTitle, r.job?.reference, r.interestArea, r.fullName,
      r.email, r.phone, r.currentLocation, r.totalExperience, r.employmentStatus, r.education, r.currentEmployer, r.linkedinUrl,
      r.expectedSalary, r.noticePeriod, candidateStatusLabels[r.status], r.retainUntil,
    ].map(cell).join(","),
  );
  await audit({ actorId: staff.id, action: "careers.candidates_export", entityType: "JobApplication", entityId: "export", after: { count: rows.length, filters: sp }, ipAddress: await clientIp() });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + [header.map(cell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vercenji-candidates-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
