"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { checkFormToken } from "@/lib/form-token";
import { checkUploads, CV_TYPES, removeFolder, storeFiles } from "@/lib/uploads";
import { getRecruitmentSettings, isAcceptingApplications, newReference, notifyNewApplication } from "@/lib/careers";
import { PRIVACY_NOTICE_VERSION } from "@/content/partner";
import {
  careersCopy,
  CV_MAX_BYTES,
  educationOptions,
  employmentStatusOptions,
  experienceOptions,
  noticePeriodOptions,
} from "@/content/careers";

export type ApplyState = { ok?: boolean; reference?: string; error?: string; fieldErrors?: Record<string, string> };

// Strips control characters (keeps line breaks in long text) before validation.
const clean = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, "");
const text = (min: number, max: number, message: string) =>
  z.string().transform(clean).pipe(z.string().trim().min(min, message).max(max, `Please keep this under ${max} characters.`));
const optionalText = (max: number) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().trim().max(max, `Please keep this under ${max} characters.`))
    .optional()
    .transform((v) => (v ? v : undefined));
const oneOf = <T extends readonly string[]>(values: T, message: string) =>
  z.string({ error: message }).refine((v): v is T[number] => (values as readonly string[]).includes(v), { message });

const schema = z.object({
  kind: z.enum(["VACANCY", "SPECULATIVE"]),
  jobId: z.string().max(64).optional(),
  positionTitle: optionalText(160),
  interestArea: optionalText(120),
  fullName: text(2, 120, "Please enter your full name."),
  email: z.email("Please enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9][0-9 ()-]{6,19}$/, "Please enter your mobile number with the country code, for example +91 98765 43210."),
  currentLocation: text(2, 120, "Please enter your current city."),
  totalExperience: oneOf(experienceOptions, "Please choose your total work experience."),
  employmentStatus: oneOf(employmentStatusOptions, "Please choose your current employment status."),
  education: oneOf(educationOptions, "Please choose your highest qualification."),
  currentEmployer: optionalText(160),
  linkedinUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/[^\s<>"']+$/i.test(v), {
      message: "Please enter a LinkedIn profile link starting with https://www.linkedin.com/ or https://in.linkedin.com/",
    }),
  expectedSalary: optionalText(80),
  noticePeriod: oneOf(noticePeriodOptions, "Please choose your notice period or availability."),
  coverLetter: text(20, 4000, "Please tell us a little about yourself (at least 20 characters)."),
  consent: z.literal("on", { error: "Please tick the consent box to submit your application." }),
  website: z.string().max(0).optional(), // honeypot: must stay empty
  formToken: z.string().max(200),
});

const fail = (fieldErrors: Record<string, string>): ApplyState => ({ error: "Please check the highlighted fields.", fieldErrors });

export async function submitJobApplication(_prev: ApplyState, form: FormData): Promise<ApplyState> {
  const ip = await clientIp();
  if (!rateLimit(`careers:ip:${ip}`, 30, 60 * 60 * 1000)) {
    return { error: "We have received several applications from your connection. Please try again in an hour." };
  }

  const raw = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => !k.startsWith("$ACTION") && k !== "cv" && typeof v === "string" && v !== ""),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    if (fieldErrors.formToken || fieldErrors.website) return { error: "Please reload the page and try again." };
    return fail(fieldErrors);
  }
  const d = parsed.data;
  if (d.website) return { ok: true, reference: newReference("VC", 6) }; // bot: pretend success, store nothing

  const token = checkFormToken("careers-apply", d.formToken);
  if (token === "too-fast") return { error: "That was very quick. Please check your details and submit again." };
  if (token === "invalid") return { error: "This form has expired. Please reload the page and try again." };

  const email = d.email.toLowerCase();

  // Which vacancy, and is it still open?
  let jobId: string | null = null;
  let positionTitle: string;
  if (d.kind === "VACANCY") {
    const job = d.jobId ? await db.jobVacancy.findUnique({ where: { id: d.jobId }, select: { id: true, title: true, status: true, deadline: true } }) : null;
    if (!job || !isAcceptingApplications(job)) {
      return { error: "Sorry, this position is no longer accepting applications." };
    }
    const recent = await db.jobApplication.count({
      where: { jobId: job.id, email, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    });
    if (recent > 0) return { error: "You have already applied for this position. Our team will be in touch if your profile matches." };
    jobId = job.id;
    positionTitle = job.title;
  } else {
    if (!d.positionTitle) return fail({ positionTitle: "Please tell us the kind of role you are interested in." });
    if (d.interestArea && !(await db.jobDepartment.count({ where: { name: d.interestArea, isActive: true } }))) {
      return fail({ interestArea: "Please choose an area from the list." });
    }
    positionTitle = d.positionTitle;
  }

  const cvFile = form.get("cv");
  if (!(cvFile instanceof File) || cvFile.size === 0) return fail({ cv: "Please upload your CV or resume." });
  const checked = await checkUploads([cvFile], CV_TYPES, { maxFiles: 1, maxFileBytes: CV_MAX_BYTES, maxTotalBytes: CV_MAX_BYTES });
  if ("error" in checked) return fail({ cv: checked.error });
  const cv = checked.files[0];

  if (!rateLimit(`careers:email:${email}`, 3, 24 * 60 * 60 * 1000)) {
    return { error: "We have already received several applications from this email address today. Please try again tomorrow." };
  }

  const settings = await getRecruitmentSettings();
  const now = new Date();
  const retainUntil = new Date(now);
  retainUntil.setMonth(retainUntil.getMonth() + settings.retentionMonths);

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newReference("VC", 6);
    let applicationId: string | null = null;
    try {
      const app = await db.jobApplication.create({
        data: {
          reference,
          kind: d.kind,
          jobId,
          positionTitle,
          interestArea: d.kind === "SPECULATIVE" ? d.interestArea : null,
          fullName: d.fullName,
          email,
          phone: d.phone.replace(/[^\d+]/g, ""),
          currentLocation: d.currentLocation,
          totalExperience: d.totalExperience,
          employmentStatus: d.employmentStatus,
          education: d.education,
          currentEmployer: d.currentEmployer,
          linkedinUrl: d.linkedinUrl,
          expectedSalary: d.expectedSalary,
          noticePeriod: d.noticePeriod,
          coverLetter: d.coverLetter,
          consentAt: now,
          consentText: careersCopy.consent,
          privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
          retainUntil,
          history: { create: { toStatus: "NEW" } },
        },
      });
      applicationId = app.id;
      // The CV is required, so the application only counts once the file is safely stored.
      const [path] = await storeFiles(`careers/${app.id}`, [cv]);
      await db.candidateDocument.create({
        data: { applicationId: app.id, path, originalName: cv.originalName, mimeType: cv.mime, sizeBytes: cv.buffer.length, sha256: cv.sha256 },
      });
      await notifyNewApplication(app);
      return { ok: true, reference };
    } catch (e) {
      if (applicationId) {
        await removeFolder(`careers/${applicationId}`).catch(() => {});
        await db.jobApplication.delete({ where: { id: applicationId } }).catch(() => {});
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // reference clash
      console.error("job application failed", e instanceof Error ? e.message : e);
      return { error: "Something went wrong on our side. Please try again in a few minutes." };
    }
  }
  return { error: "Something went wrong on our side. Please try again in a few minutes." };
}
