"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export type NewsletterState = { ok?: boolean; error?: string };

const schema = z.object({
  email: z.email("Please enter a valid email address.").max(254),
  consent: z.literal("on", { error: "Please tick the box so we can send you updates." }),
});

export async function subscribeNewsletter(_prev: NewsletterState, form: FormData): Promise<NewsletterState> {
  if (!rateLimit(`nl:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many attempts. Please try again later." };
  }
  const parsed = schema.safeParse({ email: form.get("email"), consent: form.get("consent") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const email = parsed.data.email.toLowerCase();
  await db.newsletterSubscriber.upsert({
    where: { email },
    create: { email, consentAt: new Date(), source: "home" },
    update: { consentAt: new Date(), unsubscribedAt: null },
  });
  // A confirmation email is sent once the email provider is connected (Phase 4).
  return { ok: true };
}
