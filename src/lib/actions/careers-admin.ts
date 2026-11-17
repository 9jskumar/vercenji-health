"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { CandidateStatus, DepartmentGroup, EmploymentType, ExperienceLevel, WorkArrangement } from "@/generated/prisma/enums";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { clientIp } from "@/lib/request";
import { removeFolder } from "@/lib/uploads";
import {
  endOfDayIndia,
  getRecruitmentSettings,
  newReference,
  oneLine,
  renderTemplate,
  saveRecruitmentSetting,
  sendRecruitmentEmail,
  slugify,
} from "@/lib/careers";
import { candidateStatusLabels } from "@/content/careers";

export type AdminFormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

const log = async (actorId: string, action: string, entityType: string, entityId: string, before?: Prisma.InputJsonValue, after?: Prisma.InputJsonValue) =>
  db.auditLog.create({ data: { actorId, action, entityType, entityId, before, after, ipAddress: await clientIp() } });

const fieldErrorsOf = (error: z.ZodError) => {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
};

const optional = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).optional().transform((v) => (v ? v : null));
const required = (min: number, max: number, message: string) => z.string().trim().min(min, message).max(max, `Keep this under ${max} characters.`);
const rupees = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/[,\s₹]/g, "") : ""))
  .refine((v) => v === "" || /^\d{1,9}$/.test(v), "Enter whole rupees, for example 350000.")
  .transform((v) => (v === "" ? null : Number(v)));

// ───────────── Vacancies ─────────────

const jobSchema = z
  .object({
    id: z.string().max(64).optional(),
    intent: z.enum(["draft", "publish", "save"]),
    title: required(3, 120, "Enter a job title."),
    departmentIds: z.array(z.string().max(64)).min(1, "Choose at least one department."),
    employmentType: z.enum(EmploymentType, { error: "Choose an employment type." }),
    workArrangement: z.enum(WorkArrangement, { error: "Choose a work arrangement." }),
    experienceLevel: z.enum(ExperienceLevel, { error: "Choose an experience level." }),
    experienceText: required(2, 160, "Describe the experience required."),
    education: required(2, 200, "Enter the education requirement."),
    city: required(2, 80, "Enter the city."),
    state: required(2, 80, "Enter the state."),
    openings: z.coerce.number().int().min(1, "At least 1.").max(500).default(1),
    salaryMin: rupees,
    salaryMax: rupees,
    salaryPeriod: z.enum(["YEAR", "MONTH"]).default("YEAR"),
    showSalary: z.literal("on").optional(),
    compensationNote: optional(1000),
    shortDescription: required(20, 400, "Write a short description (20 to 400 characters) for the job card."),
    summary: required(20, 6000, "Write the job summary."),
    responsibilities: required(5, 6000, "List the key responsibilities, one per line."),
    skills: required(5, 6000, "List the required skills, one per line."),
    preferred: optional(4000),
    deadline: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Choose a valid date.")
      .transform((v) => (v ? endOfDayIndia(v) : null)),
    isUrgent: z.literal("on").optional(),
    isFeatured: z.literal("on").optional(),
    seoTitle: optional(70),
    seoDescription: optional(170),
  })
  .refine((d) => d.salaryMin === null || d.salaryMax === null || d.salaryMin <= d.salaryMax, {
    path: ["salaryMax"],
    message: "The maximum must be at least the minimum.",
  })
  .refine((d) => !d.showSalary || d.salaryMin !== null || d.salaryMax !== null, {
    path: ["salaryMin"],
    message: "Enter a salary range, or untick “Show salary”.",
  });

export async function saveJob(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const raw: Record<string, unknown> = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$ACTION") && k !== "departmentIds"),
  );
  raw.departmentIds = form.getAll("departmentIds").map(String);
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;

  const now = new Date();
  if (d.intent === "publish" && d.deadline && d.deadline < now) {
    return { error: "The application deadline has passed. Choose a later date to publish.", fieldErrors: { deadline: "This date has passed." } };
  }
  const validDepts = await db.jobDepartment.count({ where: { id: { in: d.departmentIds } } });
  if (validDepts !== d.departmentIds.length) return { error: "Please choose departments from the list.", fieldErrors: { departmentIds: "Choose again." } };

  const existing = d.id ? await db.jobVacancy.findUnique({ where: { id: d.id }, select: { id: true, status: true, publishedAt: true, title: true } }) : null;
  if (d.id && !existing) return { error: "This vacancy no longer exists." };

  // "draft" saves as (or moves back to) a draft, "publish" makes it live, "save" keeps the current status.
  const status = d.intent === "publish" ? "PUBLISHED" : d.intent === "draft" ? "DRAFT" : (existing?.status ?? "DRAFT");
  const data = {
    slug: slugify(d.title),
    title: d.title,
    status,
    employmentType: d.employmentType,
    workArrangement: d.workArrangement,
    experienceLevel: d.experienceLevel,
    experienceText: d.experienceText,
    education: d.education,
    city: d.city,
    state: d.state,
    openings: d.openings,
    salaryMin: d.salaryMin,
    salaryMax: d.salaryMax,
    salaryPeriod: d.salaryMin !== null || d.salaryMax !== null ? d.salaryPeriod : null,
    showSalary: !!d.showSalary,
    compensationNote: d.compensationNote,
    shortDescription: d.shortDescription,
    summary: d.summary,
    responsibilities: d.responsibilities,
    skills: d.skills,
    preferred: d.preferred,
    deadline: d.deadline,
    isUrgent: !!d.isUrgent,
    isFeatured: !!d.isFeatured,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
    publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? now) : (existing?.publishedAt ?? null),
    closedAt: status === "PUBLISHED" ? null : undefined,
  } satisfies Prisma.JobVacancyUpdateInput;
  const departments = { create: d.departmentIds.map((departmentId) => ({ departmentId })) };

  let id = existing?.id;
  if (existing) {
    await db.$transaction([
      db.jobVacancyDepartment.deleteMany({ where: { jobId: existing.id } }),
      db.jobVacancy.update({ where: { id: existing.id }, data: { ...data, departments } }),
    ]);
    await log(staff.id, d.intent === "publish" && existing.status !== "PUBLISHED" ? "careers.job_publish" : "careers.job_update", "JobVacancy", existing.id, { status: existing.status }, { status, title: d.title });
  } else {
    for (let attempt = 0; attempt < 3 && !id; attempt++) {
      try {
        const job = await db.jobVacancy.create({ data: { ...data, reference: newReference("VJ", 5), createdById: staff.id, departments } });
        id = job.id;
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      }
    }
    if (!id) return { error: "Could not create the vacancy. Please try again." };
    await log(staff.id, status === "PUBLISHED" ? "careers.job_create_publish" : "careers.job_create", "JobVacancy", id, undefined, { status, title: d.title });
  }
  revalidatePath("/careers");
  revalidatePath("/admin/careers/jobs");
  redirect(`/admin/careers/jobs/${id}?saved=${status === "PUBLISHED" ? "published" : "saved"}`);
}

const jobOpSchema = z.object({ id: z.string().min(1).max(64), op: z.enum(["publish", "pause", "close", "duplicate", "delete"]) });

/** Publish, pause (temporarily deactivate), close, duplicate or delete a vacancy. */
export async function jobAction(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const parsed = jobOpSchema.safeParse({ id: form.get("id"), op: form.get("op") });
  if (!parsed.success) return { error: "Unknown action." };
  const { id, op } = parsed.data;
  const job = await db.jobVacancy.findUnique({ where: { id }, include: { departments: true, _count: { select: { applications: true } } } });
  if (!job) return { error: "This vacancy no longer exists." };
  const now = new Date();

  if (op === "publish") {
    if (job.deadline && job.deadline < now) return { error: "The deadline has passed. Edit the vacancy and set a new deadline before publishing." };
    await db.jobVacancy.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: job.publishedAt ?? now, closedAt: null } });
  } else if (op === "pause") {
    await db.jobVacancy.update({ where: { id }, data: { status: "PAUSED" } });
  } else if (op === "close") {
    await db.jobVacancy.update({ where: { id }, data: { status: "CLOSED", closedAt: now } });
  } else if (op === "delete") {
    if (job._count.applications > 0) {
      return { error: `This vacancy has ${job._count.applications} application(s), so it cannot be deleted. Close it instead to stop new applications.` };
    }
    await db.jobVacancy.delete({ where: { id } });
    await log(staff.id, "careers.job_delete", "JobVacancy", id, { title: job.title, reference: job.reference });
    revalidatePath("/careers");
    redirect("/admin/careers/jobs?deleted=1");
  } else if (op === "duplicate") {
    let copyId: string | null = null;
    for (let attempt = 0; attempt < 3 && !copyId; attempt++) {
      try {
        const copy = await db.jobVacancy.create({
          data: {
            reference: newReference("VJ", 5),
            slug: job.slug,
            title: `${job.title} (copy)`.slice(0, 120),
            status: "DRAFT",
            employmentType: job.employmentType,
            workArrangement: job.workArrangement,
            experienceLevel: job.experienceLevel,
            experienceText: job.experienceText,
            education: job.education,
            city: job.city,
            state: job.state,
            country: job.country,
            openings: job.openings,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryPeriod: job.salaryPeriod,
            showSalary: job.showSalary,
            compensationNote: job.compensationNote,
            shortDescription: job.shortDescription,
            summary: job.summary,
            responsibilities: job.responsibilities,
            skills: job.skills,
            preferred: job.preferred,
            deadline: null,
            isUrgent: false,
            isFeatured: false,
            seoTitle: job.seoTitle,
            seoDescription: job.seoDescription,
            createdById: staff.id,
            departments: { create: job.departments.map((x) => ({ departmentId: x.departmentId })) },
          },
        });
        copyId = copy.id;
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      }
    }
    if (!copyId) return { error: "Could not duplicate the vacancy. Please try again." };
    await log(staff.id, "careers.job_duplicate", "JobVacancy", copyId, { from: job.reference });
    redirect(`/admin/careers/jobs/${copyId}?saved=duplicated`);
  }

  await log(staff.id, `careers.job_${op}`, "JobVacancy", id, { status: job.status }, { status: op === "publish" ? "PUBLISHED" : op === "pause" ? "PAUSED" : "CLOSED" });
  revalidatePath("/careers");
  revalidatePath("/admin/careers/jobs");
  revalidatePath(`/admin/careers/jobs/${id}`);
  return { ok: true, message: op === "publish" ? "Published." : op === "pause" ? "Paused: hidden from the careers page." : "Closed: no longer accepting applications." };
}

/** Closes every published vacancy whose deadline has passed. */
export async function closeExpiredJobs(): Promise<void> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const now = new Date();
  const expired = await db.jobVacancy.findMany({ where: { status: "PUBLISHED", deadline: { lt: now } }, select: { id: true } });
  if (expired.length) {
    await db.jobVacancy.updateMany({ where: { id: { in: expired.map((j) => j.id) } }, data: { status: "CLOSED", closedAt: now } });
    for (const j of expired) await log(staff.id, "careers.job_close_expired", "JobVacancy", j.id, { status: "PUBLISHED" }, { status: "CLOSED" });
  }
  revalidatePath("/admin/careers/jobs");
  redirect(`/admin/careers/jobs?closed=${expired.length}`);
}

// ───────────── Candidates ─────────────

const updateSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(CandidateStatus),
  note: z.string().trim().max(4000).optional(),
  sendEmail: z.literal("on").optional(),
  templateKey: z.string().max(60).optional(),
  details: z.string().trim().max(3000).optional(),
});

async function emailCandidate(app: { id: string; fullName: string; email: string; positionTitle: string; reference: string; kind: string }, templateKey: string, details: string | undefined, staffId: string) {
  const tpl = await db.recruitmentEmailTemplate.findUnique({ where: { key: templateKey } });
  if (!tpl) return { ok: false, error: "That email template no longer exists." };
  const settings = await getRecruitmentSettings();
  const position = app.kind === "SPECULATIVE" ? `future opportunities (${app.positionTitle})` : app.positionTitle;
  const vars = { name: app.fullName, position, reference: app.reference, details };
  return sendRecruitmentEmail({
    applicationId: app.id,
    kind: "candidate_update",
    templateKey: tpl.key,
    to: app.email,
    subject: oneLine(renderTemplate(tpl.subject, vars)),
    body: renderTemplate(tpl.body, vars),
    replyTo: settings.notifyEmails[0],
    sentById: staffId,
  });
}

/** Changes a candidate's status, optionally emails them, and optionally adds an internal note. */
export async function updateCandidate(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const staff = await requireStaff(PERMISSIONS.careersApplications);
  const parsed = updateSchema.safeParse({
    id: form.get("id"),
    status: form.get("status"),
    note: form.get("note") || undefined,
    sendEmail: form.get("sendEmail") || undefined,
    templateKey: form.get("templateKey") || undefined,
    details: form.get("details") || undefined,
  });
  if (!parsed.success) return { error: "Please choose a valid status." };
  const { id, status, note, sendEmail, templateKey, details } = parsed.data;
  const app = await db.jobApplication.findUnique({ where: { id } });
  if (!app) return { error: "This application no longer exists." };
  const changed = app.status !== status;
  if (!changed && !note && !sendEmail) return { error: "Nothing to save: change the status, write a note or tick “Email the candidate”." };
  if (sendEmail && !templateKey) return { error: "Choose an email template." };

  if (changed) {
    await db.$transaction([
      db.jobApplication.update({ where: { id }, data: { status } }),
      db.applicationStatusHistory.create({ data: { applicationId: id, fromStatus: app.status, toStatus: status, actorId: staff.id } }),
    ]);
    await log(staff.id, "careers.candidate_status", "JobApplication", id, { status: app.status }, { status });
  }
  if (note) {
    await db.candidateNote.create({ data: { applicationId: id, authorId: staff.id, body: note } });
    await log(staff.id, "careers.candidate_note", "JobApplication", id);
  }
  let message = changed ? `Status changed to ${candidateStatusLabels[status]}.` : "Saved.";
  if (sendEmail && templateKey) {
    const res = await emailCandidate(app, templateKey, details, staff.id);
    await log(staff.id, "careers.candidate_email", "JobApplication", id, undefined, { templateKey, sent: res.ok });
    if (!res.ok) {
      revalidatePath(`/admin/careers/applications/${id}`);
      return { error: `${message} The email could not be sent: ${res.error ?? "unknown error"}. It is listed under Emails.` };
    }
    message += ` Email sent to ${app.email}.`;
  }
  revalidatePath(`/admin/careers/applications/${id}`);
  return { ok: true, message };
}

/** Permanently deletes a candidate's application, CV, notes and email log (e.g. on request under the DPDP Act). */
export async function deleteCandidate(form: FormData): Promise<void> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const id = String(form.get("id") ?? "").slice(0, 64);
  if (form.get("confirm") !== "on") redirect(`/admin/careers/applications/${id}?confirm=1`);
  const app = await db.jobApplication.findUnique({ where: { id }, select: { id: true, reference: true } });
  if (!app) redirect("/admin/careers/applications");
  await removeFolder(`careers/${app.id}`);
  await db.jobApplication.delete({ where: { id: app.id } });
  // The audit entry keeps only the reference, not the candidate's personal details.
  await log(staff.id, "careers.candidate_delete", "JobApplication", app.id, { reference: app.reference });
  redirect(`/admin/careers/applications?deleted=${encodeURIComponent(app.reference)}`);
}

// ───────────── Settings ─────────────

const settingsSchema = z.object({
  notifyEmails: z
    .string()
    .trim()
    .max(600)
    .transform((v) => [...new Set(v.split(/[\s,;]+/).map((e) => e.toLowerCase()).filter(Boolean))])
    .refine((list) => list.length <= 5, "Enter up to 5 addresses.")
    .refine((list) => list.every((e) => z.email().safeParse(e).success), "One of the addresses is not a valid email."),
  sendAcknowledgement: z.literal("on").optional(),
  retentionMonths: z.coerce.number().int().min(1, "At least 1 month.").max(60, "At most 60 months."),
});

export async function saveSettings(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const parsed = settingsSchema.safeParse({
    notifyEmails: form.get("notifyEmails") ?? "",
    sendAcknowledgement: form.get("sendAcknowledgement") || undefined,
    retentionMonths: form.get("retentionMonths"),
  });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  const before = await getRecruitmentSettings();
  const d = parsed.data;
  await saveRecruitmentSetting("notifyEmails", d.notifyEmails, staff.id);
  await saveRecruitmentSetting("sendAcknowledgement", !!d.sendAcknowledgement, staff.id);
  await saveRecruitmentSetting("retentionMonths", d.retentionMonths, staff.id);
  await log(staff.id, "careers.settings_update", "RecruitmentSetting", "careers", before, { notifyEmails: d.notifyEmails, sendAcknowledgement: !!d.sendAcknowledgement, retentionMonths: d.retentionMonths });
  revalidatePath("/admin/careers/settings");
  return { ok: true, message: "Settings saved." };
}

const templateSchema = z.object({
  key: z.string().min(1).max(60),
  subject: z.string().trim().min(3, "Enter a subject.").max(190),
  body: z.string().trim().min(10, "Enter the email text.").max(8000),
});

export async function saveTemplate(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const parsed = templateSchema.safeParse({ key: form.get("key"), subject: form.get("subject"), body: form.get("body") });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  const { key, subject, body } = parsed.data;
  const existing = await db.recruitmentEmailTemplate.findUnique({ where: { key } });
  if (!existing) return { error: "This template no longer exists." };
  await db.recruitmentEmailTemplate.update({ where: { key }, data: { subject: oneLine(subject), body, updatedById: staff.id } });
  await log(staff.id, "careers.template_update", "RecruitmentEmailTemplate", key, { subject: existing.subject }, { subject });
  revalidatePath("/admin/careers/settings");
  return { ok: true, message: "Template saved." };
}

const departmentSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(2, "Enter a name.").max(80),
  group: z.enum(DepartmentGroup),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.literal("on").optional(),
});

export async function saveDepartment(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const staff = await requireStaff(PERMISSIONS.careersManage);
  const parsed = departmentSchema.safeParse({
    id: form.get("id") || undefined,
    name: form.get("name"),
    group: form.get("group"),
    sortOrder: form.get("sortOrder") || 0,
    isActive: form.get("isActive") || undefined,
  });
  if (!parsed.success) return { error: "Please check the department details.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  try {
    if (d.id) {
      await db.jobDepartment.update({ where: { id: d.id }, data: { name: d.name, group: d.group, sortOrder: d.sortOrder, isActive: !!d.isActive } });
      await log(staff.id, "careers.department_update", "JobDepartment", d.id, undefined, { name: d.name, isActive: !!d.isActive });
    } else {
      const dept = await db.jobDepartment.create({ data: { slug: slugify(d.name), name: d.name, group: d.group, sortOrder: d.sortOrder, isActive: true } });
      await log(staff.id, "careers.department_create", "JobDepartment", dept.id, undefined, { name: d.name });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "A department with a similar name already exists." };
    throw e;
  }
  revalidatePath("/admin/careers/settings");
  return { ok: true, message: "Department saved." };
}
