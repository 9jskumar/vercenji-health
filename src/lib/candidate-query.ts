import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { CandidateStatus } from "@/generated/prisma/enums";

type SP = Record<string, string | string[] | undefined>;

export const SORTS = { newest: "Newest first", oldest: "Oldest first", name: "Name A to Z", status: "Status" } as const;
export type SortKey = keyof typeof SORTS;

/** Shared by the candidate list and the CSV export, so the export matches what is on screen. */
export function candidateQuery(sp: SP) {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim().slice(0, 100) : "");
  const status = Object.values(CandidateStatus).find((x) => x === s("status"));
  const kind = s("kind") === "SPECULATIVE" || s("kind") === "VACANCY" ? (s("kind") as "SPECULATIVE" | "VACANCY") : undefined;
  const job = s("job").slice(0, 64) || undefined;
  const q = s("q");
  const location = s("location");
  const experience = s("experience");
  const sort: SortKey = (Object.keys(SORTS) as SortKey[]).find((k) => k === s("sort")) ?? "newest";
  const where: Prisma.JobApplicationWhereInput = {
    ...(status && { status }),
    ...(kind && { kind }),
    ...(job && { jobId: job }),
    ...(location && { currentLocation: { contains: location } }),
    ...(experience && { totalExperience: experience }),
    ...(q && {
      OR: [
        { reference: { contains: q } },
        { fullName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { positionTitle: { contains: q } },
        { currentEmployer: { contains: q } },
      ],
    }),
  };
  const orderBy: Prisma.JobApplicationOrderByWithRelationInput[] =
    sort === "oldest" ? [{ createdAt: "asc" }] : sort === "name" ? [{ fullName: "asc" }] : sort === "status" ? [{ status: "asc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }];
  return { where, orderBy, filters: { status, kind, job, q, location, experience, sort } };
}
