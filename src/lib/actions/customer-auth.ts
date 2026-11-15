"use server";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { sendMail } from "@/lib/mail";
import { company } from "@/lib/site";
import { createCustomerSession, destroyCustomerSession, getCustomer, safeNext } from "@/lib/auth/customer";

export type CodeRequestState = { error?: string; sentTo?: string };
export type CodeVerifyState = { error?: string };

const PENDING_COOKIE = "vh_otp";
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function codeHash(challengeId: string, code: string) {
  const key = process.env.SESSION_SECRET || process.env.APP_ENCRYPTION_KEY;
  if (!key) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", key).update(`${challengeId}:${code}`).digest("hex");
}

const emailSchema = z.email().max(254);

/** Step 1: email a 6-digit sign-in code. New customers get an account when they first sign in. */
export async function requestLoginCode(_prev: CodeRequestState, form: FormData): Promise<CodeRequestState> {
  const ip = await clientIp();
  const parsed = emailSchema.safeParse(String(form.get("email") ?? "").trim());
  if (!parsed.success) return { error: "Please enter a valid email address." };
  const email = parsed.data.toLowerCase();
  if (!rateLimit(`otp:ip:${ip}`, 10, 60 * 60 * 1000) || !rateLimit(`otp:email:${email}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many codes requested. Please wait an hour and try again." };
  }

  const user = await db.user.findUnique({ where: { email }, select: { kind: true, isActive: true } });
  // Staff use the staff sign-in with their authenticator app; disabled accounts cannot sign in.
  // Both get the same answer as everyone else, so the form does not reveal which emails exist.
  const allowed = !user || (user.kind === "CUSTOMER" && user.isActive);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const challenge = await db.otpChallenge.create({
    data: { channel: "EMAIL", target: email, codeHash: "pending", expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  await db.otpChallenge.update({ where: { id: challenge.id }, data: { codeHash: allowed ? codeHash(challenge.id, code) : "disabled" } });

  if (allowed) {
    const sent = await sendMail({
      to: email,
      subject: `${code} is your Vercenji sign-in code`,
      text: [
        `Your Vercenji sign-in code is ${code}.`,
        "",
        "It expires in 10 minutes. If you did not ask for it, you can ignore this email.",
        "Vercenji will never ask you for this code by phone or chat.",
        "",
        `Help: ${company.supportEmail} · ${company.supportPhone}`,
      ].join("\n"),
    });
    if (!sent) return { error: "We could not send the email just now. Please try again in a few minutes." };
  }

  (await cookies()).set(PENDING_COOKIE, challenge.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CODE_TTL_MS / 1000,
  });
  return { sentTo: email };
}

/** Step 2: check the code and sign the customer in. */
export async function verifyLoginCode(_prev: CodeVerifyState, form: FormData): Promise<CodeVerifyState> {
  const ip = await clientIp();
  if (!rateLimit(`otp-verify:ip:${ip}`, 30, 15 * 60 * 1000)) return { error: "Too many attempts. Please wait 15 minutes." };
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from the email." };

  const jar = await cookies();
  const id = jar.get(PENDING_COOKIE)?.value;
  const challenge = id ? await db.otpChallenge.findUnique({ where: { id } }) : null;
  if (!challenge || challenge.usedAt || challenge.expiresAt < new Date() || challenge.attempts >= MAX_ATTEMPTS) {
    return { error: "This code has expired. Please ask for a new one." };
  }

  // Count the attempt first, so parallel guesses cannot get past the limit.
  const counted = await db.otpChallenge.updateMany({
    where: { id: challenge.id, usedAt: null, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count !== 1) return { error: "This code has expired. Please ask for a new one." };

  const expected = Buffer.from(challenge.codeHash);
  const actual = Buffer.from(codeHash(challenge.id, code));
  const ok = challenge.codeHash !== "disabled" && expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!ok) {
    const left = MAX_ATTEMPTS - challenge.attempts - 1;
    return { error: left > 0 ? `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.` : "That code is not right. Please ask for a new one." };
  }

  const used = await db.otpChallenge.updateMany({ where: { id: challenge.id, usedAt: null }, data: { usedAt: new Date() } });
  if (used.count !== 1) return { error: "This code has already been used. Please ask for a new one." };
  jar.delete(PENDING_COOKIE);

  const email = challenge.target;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && (existing.kind !== "CUSTOMER" || !existing.isActive)) return { error: "This code has expired. Please ask for a new one." };
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { emailVerified: existing.emailVerified ?? new Date() } })
    : await db.user.create({ data: { email, kind: "CUSTOMER", emailVerified: new Date() } });

  await createCustomerSession(user.id, ip, (await headers()).get("user-agent"));
  await audit({ actorId: user.id, action: existing ? "customer.login" : "customer.signup", entityType: "User", entityId: user.id, ipAddress: ip });
  redirect(safeNext(form.get("next")));
}

export async function customerLogout() {
  const customer = await getCustomer();
  await destroyCustomerSession();
  if (customer) await audit({ actorId: customer.id, action: "customer.logout", entityType: "User", entityId: customer.id });
  redirect("/");
}

/** Lets a customer save the name shown on their account. */
export async function updateCustomerName(_prev: { ok?: boolean; error?: string }, form: FormData): Promise<{ ok?: boolean; error?: string }> {
  const customer = await getCustomer();
  if (!customer) redirect("/login");
  const name = String(form.get("name") ?? "").trim();
  if (name.length > 120) return { error: "Please keep your name under 120 characters." };
  await db.user.update({ where: { id: customer.id }, data: { name: name || null } });
  return { ok: true };
}
