import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { readStoredFile } from "@/lib/uploads";

// Serves an applicant's document to authorised staff only. Files never sit in a public folder.
export async function GET(_req: Request, ctx: RouteContext<"/admin/documents/[id]">) {
  const staff = await getStaff();
  if (!staff) return new Response("Not signed in", { status: 401 });
  if (!hasPermission(staff.permissions, PERMISSIONS.applicationsDocuments)) return new Response("Forbidden", { status: 403 });

  const { id } = await ctx.params;
  const doc = await db.applicationDocument.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  const data = await readStoredFile(doc.path);
  await audit({ actorId: staff.id, action: "application.document_download", entityType: "ApplicationDocument", entityId: doc.id });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
