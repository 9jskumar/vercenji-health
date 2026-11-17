import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getStaff } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { clientIp } from "@/lib/request";
import { readStoredFile } from "@/lib/uploads";

// Serves a candidate's CV to authorised staff only. CVs never sit in a public folder and have no public URL.
export async function GET(_req: Request, ctx: RouteContext<"/admin/careers/cv/[id]">) {
  const staff = await getStaff();
  if (!staff) return new Response("Not signed in", { status: 401 });
  if (!hasPermission(staff.permissions, PERMISSIONS.careersCvs)) return new Response("Forbidden", { status: 403 });

  const { id } = await ctx.params;
  const doc = await db.candidateDocument.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readStoredFile(doc.path);
  } catch {
    return new Response("The file is missing from storage.", { status: 404 });
  }
  await audit({ actorId: staff.id, action: "careers.cv_download", entityType: "CandidateDocument", entityId: doc.id, ipAddress: await clientIp() });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
