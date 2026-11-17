import "server-only";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { sendMailWithResult } from "@/lib/mail";
import type { Prisma } from "@/generated/prisma/client";
import type { EmploymentType, ExperienceLevel } from "@/generated/prisma/enums";
import { company } from "@/lib/site";

// ───────────── References and URLs ─────────────

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O or 1/I

export function newReference(prefix: "VJ" | "VC", length: number) {
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${new Date().getFullYear()}-${s}`;
}

/** Public URL of a vacancy: /careers/<title-slug>-<reference>, e.g. /careers/sales-executive-vj-2026-4kq8m */
export const jobPath = (job: { slug: string; reference: string }) => `/careers/${job.slug}-${job.reference.toLowerCase()}`;

/** Reads the reference from the last part of a job URL. */
export function referenceFromParam(param: string): string | null {
  const m = /(?:^|-)(vj-\d{4}-[a-z0-9]{5})$/i.exec(decodeURIComponent(param));
  return m ? m[1].toUpperCase() : null;
}

export const siteUrl = () => (process.env.SITE_URL ?? "https://vercenji.com").replace(/\/$/, "");

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "job";

/** "2026-12-31" → the last moment of that day in India. */
export function endOfDayIndia(date: string): Date {
  return new Date(`${date}T23:59:59.999+05:30`);
}

/** Date → "2026-12-31" in India time, for date inputs. */
export function indiaDateString(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

type OpenCheck = { status: string; deadline: Date | null };
export const isExpired = (job: OpenCheck, now = new Date()) => !!job.deadline && job.deadline < now;
export const isAcceptingApplications = (job: OpenCheck, now = new Date()) => job.status === "PUBLISHED" && !isExpired(job, now);

// ───────────── Public listing ─────────────

export const PUBLIC_PAGE_SIZE = 10;

export type JobFilters = {
  q?: string;
  department?: string; // department slug
  location?: string; // city, or "remote"
  type?: EmploymentType;
  level?: ExperienceLevel;
  page?: number;
};

export function openJobsWhere(now: Date): Prisma.JobVacancyWhereInput {
  return { status: "PUBLISHED", OR: [{ deadline: null }, { deadline: { gte: now } }] };
}

const cardSelect = {
  id: true,
  reference: true,
  slug: true,
  title: true,
  employmentType: true,
  workArrangement: true,
  experienceLevel: true,
  experienceText: true,
  education: true,
  city: true,
  state: true,
  salaryMin: true,
  salaryMax: true,
  salaryPeriod: true,
  showSalary: true,
  shortDescription: true,
  publishedAt: true,
  deadline: true,
  isUrgent: true,
  isFeatured: true,
  departments: { select: { department: { select: { name: true, slug: true } } } },
} satisfies Prisma.JobVacancySelect;

export type JobCardData = Prisma.JobVacancyGetPayload<{ select: typeof cardSelect }>;

export async function listOpenJobs(f: JobFilters) {
  const now = new Date();
  const and: Prisma.JobVacancyWhereInput[] = [openJobsWhere(now)];
  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q } },
        { shortDescription: { contains: f.q } },
        { summary: { contains: f.q } },
        { skills: { contains: f.q } },
        { city: { contains: f.q } },
        { reference: { contains: f.q } },
      ],
    });
  }
  if (f.department) and.push({ departments: { some: { department: { slug: f.department, isActive: true } } } });
  if (f.location === "remote") and.push({ workArrangement: "REMOTE" });
  else if (f.location) and.push({ city: f.location });
  if (f.type) and.push({ employmentType: f.type });
  if (f.level) and.push({ experienceLevel: f.level });
  const where: Prisma.JobVacancyWhereInput = { AND: and };
  const page = Math.max(1, f.page ?? 1);
  const [jobs, total] = await Promise.all([
    db.jobVacancy.findMany({
      where,
      select: cardSelect,
      orderBy: [{ isFeatured: "desc" }, { isUrgent: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * PUBLIC_PAGE_SIZE,
      take: PUBLIC_PAGE_SIZE,
    }),
    db.jobVacancy.count({ where }),
  ]);
  return { jobs, total, page, pages: Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE)) };
}

/** Departments with their number of open vacancies, and the cities that have open vacancies. */
export async function careersFacets() {
  const now = new Date();
  const [departments, cities, anyOpen, remote] = await Promise.all([
    db.jobDepartment.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true, group: true, _count: { select: { jobs: { where: { job: openJobsWhere(now) } } } } },
    }),
    db.jobVacancy.findMany({ where: openJobsWhere(now), select: { city: true }, distinct: ["city"], orderBy: { city: "asc" } }),
    db.jobVacancy.count({ where: openJobsWhere(now) }),
    db.jobVacancy.count({ where: { AND: [openJobsWhere(now), { workArrangement: "REMOTE" }] } }),
  ]);
  return {
    departments: departments.map((d) => ({ slug: d.slug, name: d.name, group: d.group, open: d._count.jobs })),
    cities: cities.map((c) => c.city),
    hasRemote: remote > 0,
    openCount: anyOpen,
  };
}

const detailInclude = {
  departments: { include: { department: { select: { name: true, slug: true } } } },
} satisfies Prisma.JobVacancyInclude;

export type JobDetailData = Prisma.JobVacancyGetPayload<{ include: typeof detailInclude }>;

/** A vacancy that the public may see: published, or closed (shown with a notice). Drafts and paused jobs are hidden. */
export async function getPublicJob(param: string) {
  const reference = referenceFromParam(param);
  if (!reference) return null;
  return db.jobVacancy.findFirst({ where: { reference, status: { in: ["PUBLISHED", "CLOSED"] } }, include: detailInclude });
}

export async function getJobForStaff(id: string) {
  return db.jobVacancy.findUnique({ where: { id }, include: detailInclude });
}

// ───────────── Settings and templates ─────────────

export type RecruitmentSettings = { notifyEmails: string[]; sendAcknowledgement: boolean; retentionMonths: number };

export async function getRecruitmentSettings(): Promise<RecruitmentSettings> {
  const rows = await db.recruitmentSetting.findMany();
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  const emails = get("notifyEmails");
  const months = Number(get("retentionMonths"));
  return {
    notifyEmails: Array.isArray(emails) ? emails.filter((e): e is string => typeof e === "string") : [],
    sendAcknowledgement: get("sendAcknowledgement") !== false,
    retentionMonths: Number.isInteger(months) && months > 0 ? months : 12,
  };
}

export async function saveRecruitmentSetting(key: keyof RecruitmentSettings, value: Prisma.InputJsonValue, actorId: string) {
  await db.recruitmentSetting.upsert({
    where: { key },
    create: { key, value, updatedById: actorId },
    update: { value, updatedById: actorId },
  });
}

export type TemplateVars = { name: string; position: string; reference: string; details?: string };

/** Fills {{placeholders}}. A line holding only {{details}} is dropped when no details are given. */
export function renderTemplate(text: string, vars: TemplateVars) {
  const details = (vars.details ?? "").trim();
  const t = details ? text : text.replace(/^[ \t]*\{\{details\}\}[ \t]*$/gm, "");
  return t
    .replace(/\{\{(name|position|reference|details)\}\}/g, (_, k: keyof TemplateVars) => (k === "details" ? details : (vars[k] ?? "")))
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Subjects are one line. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim().slice(0, 190);

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A simple branded HTML version of a plain-text email. */
function htmlEmail(text: string) {
  const body = escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#2b2b2b;max-width:600px">
<div style="background:#16321d;color:#f7f3ea;padding:16px 20px;font-family:Georgia,serif;font-size:20px">Vercenji Careers</div>
<div style="padding:20px">${body}</div>
<div style="padding:12px 20px;font-size:12px;color:#6b6b66;border-top:1px solid #e6dfd0">${escapeHtml(company.legalName)} · ${escapeHtml(company.registeredAddress)}</div>
</div>`;
}

/** Sends one recruitment email and records it in the email log, whatever the outcome. */
export async function sendRecruitmentEmail(input: {
  applicationId: string | null;
  kind: "admin_alert" | "candidate_ack" | "candidate_update";
  templateKey?: string;
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
  sentById?: string;
}) {
  const result = await sendMailWithResult({
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: input.kind === "admin_alert" ? undefined : htmlEmail(input.body),
    replyTo: input.replyTo,
  });
  await db.recruitmentEmailLog.create({
    data: {
      applicationId: input.applicationId,
      kind: input.kind,
      templateKey: input.templateKey,
      toEmail: input.to,
      subject: input.subject.slice(0, 190),
      body: input.body,
      status: result.ok ? "SENT" : "FAILED",
      error: result.error,
      sentById: input.sentById,
    },
  });
  return result;
}

/** Emails the recruitment inbox(es) and acknowledges the candidate. Never throws: the application is already saved. */
export async function notifyNewApplication(app: {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  positionTitle: string;
  kind: "VACANCY" | "SPECULATIVE";
  createdAt: Date;
}) {
  try {
    const settings = await getRecruitmentSettings();
    const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(app.createdAt);
    const position = app.kind === "SPECULATIVE" ? `Future opportunities (${app.positionTitle})` : app.positionTitle;
    const subject = `New application: ${position} (${app.reference})`;
    const body = [
      `A new application has been received on vercenji.com.`,
      ``,
      `Candidate: ${app.fullName}`,
      `Position: ${position}`,
      `Reference: ${app.reference}`,
      `Submitted: ${when} (India time)`,
      ``,
      `Open it in the admin (sign-in required):`,
      `${siteUrl()}/admin/careers/applications/${app.id}`,
    ].join("\n");

    if (settings.notifyEmails.length === 0) {
      await db.recruitmentEmailLog.create({
        data: {
          applicationId: app.id,
          kind: "admin_alert",
          toEmail: "(not set)",
          subject,
          body,
          status: "SKIPPED",
          error: "No recruitment email is set in Admin → Careers → Settings.",
        },
      });
    } else {
      for (const to of settings.notifyEmails) {
        await sendRecruitmentEmail({ applicationId: app.id, kind: "admin_alert", to, subject, body, replyTo: app.email });
      }
    }

    if (settings.sendAcknowledgement) {
      const tpl = await db.recruitmentEmailTemplate.findUnique({ where: { key: "application_received" } });
      if (tpl) {
        const vars = { name: app.fullName, position, reference: app.reference };
        await sendRecruitmentEmail({
          applicationId: app.id,
          kind: "candidate_ack",
          templateKey: tpl.key,
          to: app.email,
          subject: oneLine(renderTemplate(tpl.subject, vars)),
          body: renderTemplate(tpl.body, vars),
          replyTo: settings.notifyEmails[0],
        });
      }
    }
  } catch (e) {
    console.error("[careers] notification failed", e instanceof Error ? e.message : e);
  }
}
