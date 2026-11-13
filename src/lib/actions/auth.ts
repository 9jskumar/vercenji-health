"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { decryptSecret, DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { createStaffSession, destroyStaffSession, getStaff } from "@/lib/auth/session";

export type LoginState = { error?: string };

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
  code: z.string().trim().regex(/^\d{6}$/),
});

const GENERIC = "Those details do not match. Check your email, password and the 6-digit code from your authenticator app.";

export async function staffLogin(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = await clientIp();
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password"), code: form.get("code") });
  const email = parsed.success ? parsed.data.email.toLowerCase() : "";
  if (!rateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000) || (email && !rateLimit(`login:email:${email}`, 5, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  if (!parsed.success) return { error: GENERIC };

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  const eligible = !!user && user.kind === "STAFF" && user.isActive && !!user.totpSecret;
  const codeOk = eligible && passwordOk && verifyTotp(decryptSecret(user.totpSecret!), parsed.data.code);

  if (!eligible || !passwordOk || !codeOk) {
    if (user) await audit({ actorId: user.id, action: "staff.login_failed", entityType: "User", entityId: user.id, ipAddress: ip });
    return { error: GENERIC };
  }

  await createStaffSession(user.id, ip, (await headers()).get("user-agent"));
  await audit({ actorId: user.id, action: "staff.login", entityType: "User", entityId: user.id, ipAddress: ip });
  redirect("/admin");
}

export async function staffLogout() {
  const staff = await getStaff();
  await destroyStaffSession();
  if (staff) await audit({ actorId: staff.id, action: "staff.logout", entityType: "User", entityId: staff.id });
  redirect("/admin/login");
}
