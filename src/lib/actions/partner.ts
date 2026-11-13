"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma, type PartnerModel } from "@/generated/prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import {
  countries,
  investmentRanges,
  kitchenStructures,
  launchTimelines,
  partnerModels,
  PRIVACY_NOTICE_VERSION,
} from "@/content/partner";

export type PartnerFormState = {
  ok?: boolean;
  reference?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const oneOf = <T extends readonly string[]>(values: T, message: string) =>
  z.string().refine((v): v is T[number] => (values as readonly string[]).includes(v), { message });

const schema = z
  .object({
    model: oneOf(partnerModels.map((m) => m.id), "Please choose a partnership model."),
    fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
    companyName: optionalText(160),
    email: z.email("Please enter a valid email address.").max(254),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{8,20}$/, "Please enter a valid mobile number, with country code if outside India."),
    country: oneOf(countries.map((c) => c.code), "Please choose a country."),
    city: z.string().trim().min(2, "Please enter your city.").max(80),
    proposedLocation: z.string().trim().min(2, "Please enter a preferred location.").max(160),
    investmentRange: oneOf(investmentRanges, "Please choose an investment range."),
    launchTimeline: oneOf(launchTimelines, "Please choose a timeline.").optional(),
    hasKitchen: z.enum(["yes-owned", "yes-leased", "no"]).optional(),
    kitchenStructure: oneOf(kitchenStructures, "Please choose a kitchen structure.").optional(),
    experience: optionalText(2000),
    proposal: optionalText(4000),
    consentPrivacy: z.literal("on", { error: "Please agree to the privacy notice to continue." }),
    consentDisclaimer: z.literal("on", { error: "Please confirm you have read the partnership disclaimer." }),
    marketing: z.literal("on").optional(),
    website: z.string().max(0).optional(), // honeypot: must stay empty
  })
  .refine((d) => d.model !== "CLOUD_KITCHEN" || d.kitchenStructure, {
    path: ["kitchenStructure"],
    message: "Please choose a kitchen structure.",
  });

function normalisePhone(raw: string, country: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (country === "IN" && /^\d{10}$/.test(digits)) return `+91${digits}`;
  if (country === "AE" && /^0?5\d{8}$/.test(digits)) return `+971${digits.replace(/^0/, "")}`;
  return digits;
}

function newReference(year: number) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[randomInt(alphabet.length)];
  return `VP-${year}-${s}`;
}

const RETENTION_MONTHS = 24; // decision 16: unprogressed applications

export async function submitPartnerApplication(_prev: PartnerFormState, form: FormData): Promise<PartnerFormState> {
  const ip = await clientIp();
  if (!rateLimit(`partner:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "We have received several applications from your connection. Please try again in an hour." };
  }

  const raw = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => !k.startsWith("$ACTION") && typeof v === "string" && v !== ""),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { ok: true, reference: newReference(new Date().getFullYear()) }; // bot: pretend success

  const now = new Date();
  const retainUntil = new Date(now);
  retainUntil.setMonth(retainUntil.getMonth() + RETENTION_MONTHS);

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newReference(now.getFullYear());
    try {
      await db.partnerApplication.create({
        data: {
          reference,
          model: d.model as PartnerModel,
          kitchenStructure: d.model === "CLOUD_KITCHEN" ? d.kitchenStructure : null,
          fullName: d.fullName,
          companyName: d.companyName,
          email: d.email.toLowerCase(),
          phone: normalisePhone(d.phone, d.country),
          country: d.country,
          city: d.city,
          proposedLocation: d.proposedLocation,
          experience: d.experience,
          hasKitchen: d.hasKitchen ? d.hasKitchen !== "no" : null,
          investmentRange: d.investmentRange,
          launchTimeline: d.launchTimeline,
          proposal: d.proposal,
          consentAt: now,
          privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
          retainUntil,
        },
      });
      if (d.marketing) {
        await db.newsletterSubscriber.upsert({
          where: { email: d.email.toLowerCase() },
          create: { email: d.email.toLowerCase(), consentAt: now, source: "partner-application" },
          update: { consentAt: now, unsubscribedAt: null },
        });
      }
      // Confirmation email and staff alert are sent once the email provider is connected (Phase 4).
      return { ok: true, reference };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // reference clash
      console.error("partner application failed", e);
      return { error: "Something went wrong on our side. Please try again in a few minutes." };
    }
  }
  return { error: "Something went wrong on our side. Please try again in a few minutes." };
}
