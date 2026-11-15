import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "./crypto";

const COOKIE = "vh_customer";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // customers stay signed in for 30 days

export async function createCustomerSession(userId: string, ip: string, userAgent: string | null) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.session.create({
    data: { id: sha256(token), userId, expiresAt, ipAddress: ip, userAgent: userAgent?.slice(0, 255) },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}

export type Customer = { id: string; email: string; name: string | null };

/** The signed-in customer, or null. Staff accounts never count as customers. Cached per request. */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  await connection();
  const session = await db.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (u.kind !== "CUSTOMER" || !u.isActive || !u.email) return null;
  return { id: u.id, email: u.email, name: u.name };
});

/** Only same-site paths are allowed as a place to return to after signing in. */
export function safeNext(next: unknown, fallback = "/account"): string {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) && !next.startsWith("/admin") ? next : fallback;
}

/** Use at the top of every account page and action. */
export async function requireCustomer(next = "/account"): Promise<Customer> {
  const customer = await getCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return customer;
}

/** Orders that belong to this customer: placed while signed in, or as a guest with the same (verified) email. */
export const customerOrderWhere = (c: Customer) => ({ OR: [{ userId: c.id }, { guestEmail: c.email }] });
