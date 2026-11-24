"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { sendMail } from "@/lib/mail";
import { company } from "@/lib/site";
import { enquiryCountries, enquiryInterests } from "@/content/ems";

export type EnquiryFormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const optional = (max: number) =>
  z.string().trim().max(max, `Please keep this under ${max} characters.`).transform((v) => (v === "" ? undefined : v)).optional();

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120, "Please keep your name under 120 characters."),
  company: optional(160),
  email: z.email("Please enter a valid email address.").max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/, "Please enter a valid mobile number, with country code if outside India."),
  city: optional(80),
  country: z.enum(enquiryCountries.map(([c]) => c) as [string, ...string[]], { error: "Please choose a country." }),
  interest: z.enum(enquiryInterests.map(([i]) => i) as [string, ...string[]], { error: "Please choose what you would like." }),
  message: optional(3000),
  consent: z.literal("on", { error: "Please agree to be contacted about your request." }),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

/** "Request a demo" on the EMS Wellness page. Saved for the team in the admin, with an email alert to support. */
export async function submitEquipmentEnquiry(_prev: EnquiryFormState, form: FormData): Promise<EnquiryFormState> {
  const ip = await clientIp();
  if (!rateLimit(`equipment:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "We have received several requests from your connection. Please try again in an hour." };
  }
  const raw = Object.fromEntries([...form.entries()].filter(([k, v]) => !k.startsWith("$ACTION") && typeof v === "string" && v !== ""));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { ok: true }; // bot: pretend success

  try {
    const e = await db.equipmentEnquiry.create({
      data: {
        name: d.name,
        company: d.company,
        email: d.email.toLowerCase(),
        phone: d.phone,
        city: d.city,
        country: d.country,
        interest: d.interest,
        message: d.message,
        consentAt: new Date(),
      },
    });
    const interest = enquiryInterests.find(([k]) => k === d.interest)?.[1] ?? d.interest;
    const country = enquiryCountries.find(([k]) => k === d.country)?.[1] ?? d.country;
    // Best effort: the enquiry is already saved and listed in the admin even if email is down.
    await sendMail({
      to: company.supportEmail,
      replyTo: d.email,
      subject: `EMS suit enquiry: ${interest} from ${d.name}`,
      text: [
        `New EMS Wellness enquiry (${interest}).`,
        "",
        `Name: ${d.name}`,
        `Business: ${d.company ?? "-"}`,
        `Email: ${d.email}`,
        `Phone: ${d.phone}`,
        `Location: ${[d.city, country].filter(Boolean).join(", ")}`,
        "",
        d.message ?? "(no message)",
        "",
        `Open in the admin: ${process.env.SITE_URL ?? ""}/admin/enquiries#${e.id}`,
      ].join("\n"),
    });
    return { ok: true };
  } catch (e) {
    console.error("equipment enquiry failed", e);
    return { error: "Something went wrong on our side. Please try again in a few minutes, or email us." };
  }
}

const statuses = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"] as const;

/** Admin: move an enquiry through NEW → CONTACTED → QUOTED → WON / LOST. */
export async function setEnquiryStatus(form: FormData) {
  const staff = await requireStaff(PERMISSIONS.applicationsUpdate);
  const id = String(form.get("id") ?? "").slice(0, 64);
  const status = statuses.find((s) => s === form.get("status"));
  if (!id || !status) return;
  const before = await db.equipmentEnquiry.findUnique({ where: { id }, select: { status: true } });
  if (!before) return;
  await db.equipmentEnquiry.update({ where: { id }, data: { status } });
  await audit({ actorId: staff.id, action: "enquiry.status", entityType: "EquipmentEnquiry", entityId: id, before, after: { status } });
  revalidatePath("/admin/enquiries");
}
