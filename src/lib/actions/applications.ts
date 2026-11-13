"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/request";
import { requireStaff } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ApplicationStatus } from "@/generated/prisma/enums";

export type UpdateState = { ok?: boolean; error?: string };

const schema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(ApplicationStatus),
  note: z.string().trim().max(4000).optional(),
});

/** Changes an application's status and/or adds an internal note. */
export async function updateApplication(_prev: UpdateState, form: FormData): Promise<UpdateState> {
  const staff = await requireStaff(PERMISSIONS.applicationsUpdate);
  const parsed = schema.safeParse({
    id: form.get("id"),
    status: form.get("status"),
    note: form.get("note") || undefined,
  });
  if (!parsed.success) return { error: "Please choose a valid status." };
  const { id, status, note } = parsed.data;

  const current = await db.partnerApplication.findUnique({ where: { id }, select: { status: true } });
  if (!current) return { error: "This application no longer exists." };
  const changed = current.status !== status;
  if (!changed && !note) return { error: "Nothing to save: change the status or write a note." };

  await db.$transaction([
    ...(changed ? [db.partnerApplication.update({ where: { id }, data: { status } })] : []),
    db.applicationNote.create({
      data: { applicationId: id, authorId: staff.id, body: note ?? "", statusChange: changed ? status : null },
    }),
    db.auditLog.create({
      data: {
        actorId: staff.id,
        action: changed ? "application.status" : "application.note",
        entityType: "PartnerApplication",
        entityId: id,
        before: changed ? { status: current.status } : undefined,
        after: changed ? { status } : undefined,
        ipAddress: await clientIp(),
      },
    }),
  ]);
  revalidatePath(`/admin/applications/${id}`);
  return { ok: true };
}

export async function assignToMe(form: FormData) {
  const staff = await requireStaff(PERMISSIONS.applicationsUpdate);
  const id = String(form.get("id") ?? "");
  await db.partnerApplication.update({ where: { id }, data: { assigneeId: staff.id } });
  await audit({ actorId: staff.id, action: "application.assign", entityType: "PartnerApplication", entityId: id, after: { assigneeId: staff.id } });
  revalidatePath(`/admin/applications/${id}`);
}
