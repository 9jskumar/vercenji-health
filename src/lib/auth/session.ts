import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "./crypto";
import { hasPermission, type Permission } from "./permissions";

const COOKIE = "vh_staff";
const TTL_MS = 12 * 60 * 60 * 1000; // staff sessions last 12 hours

export async function createStaffSession(userId: string, ip: string, userAgent: string | null) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.session.create({
    data: { id: sha256(token), userId, expiresAt, ipAddress: ip, userAgent: userAgent?.slice(0, 255) },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyStaffSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}

export type StaffUser = { id: string; name: string | null; email: string | null; permissions: string[] };

/** The signed-in staff member, or null. Cached per request. */
export const getStaff = cache(async (): Promise<StaffUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  // Staff data is read per request, never during a prefetch: the session check depends on the current time.
  await connection();
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (u.kind !== "STAFF" || !u.isActive) return null;
  const permissions = u.roles.flatMap((r) => (Array.isArray(r.role.permissions) ? (r.role.permissions as string[]) : []));
  return { id: u.id, name: u.name, email: u.email, permissions };
});

/** Use at the top of every admin page and server action. */
export async function requireStaff(permission?: Permission): Promise<StaffUser> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (permission && !hasPermission(staff.permissions, permission)) redirect("/admin?denied=1");
  return staff;
}
