import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { isLive } from "@/lib/site";
import { jobPath, openJobsWhere, siteUrl } from "@/lib/careers";
import { legalPages } from "@/content/legal";

// Built on request, so new vacancies appear (and closed ones drop out) without a rebuild.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...(isLive("nutrition") ? [{ url: `${base}/nutrition`, changeFrequency: "weekly" as const, priority: 0.9 }] : []),
    ...(isLive("ems") ? [{ url: `${base}/vercenji-ems-wellness-training-suit`, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    ...(isLive("lifestyle") ? [{ url: `${base}/lifestyle`, changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...(isLive("partner") ? [{ url: `${base}/partner`, changeFrequency: "monthly" as const, priority: 0.7 }] : []),
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.5 },
    // Draft policy pages are not indexed until approved.
    ...legalPages.filter((p) => p.approved).map((p) => ({ url: `${base}/legal/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
  try {
    const verticals = (["NUTRITION", "LIFESTYLE"] as const).filter((v) => isLive(v === "NUTRITION" ? "nutrition" : "lifestyle"));
    const [products, jobs] = await Promise.all([
      db.product.findMany({ where: { status: "ACTIVE", vertical: { in: [...verticals] }, variants: { some: { isActive: true } } }, select: { slug: true, vertical: true, updatedAt: true } }),
      isLive("careers") ? db.jobVacancy.findMany({ where: openJobsWhere(now), select: { slug: true, reference: true, updatedAt: true } }) : Promise.resolve([]),
    ]);
    for (const p of products) pages.push({ url: `${base}/${p.vertical.toLowerCase()}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.7 });
    if (isLive("careers")) {
      pages.push({ url: `${base}/careers`, changeFrequency: "daily", priority: 0.7 });
      pages.push({ url: `${base}/careers/future-opportunities`, changeFrequency: "monthly", priority: 0.4 });
      for (const j of jobs) pages.push({ url: `${base}${jobPath(j)}`, lastModified: j.updatedAt, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch (e) {
    console.error("[sitemap] database unavailable", e instanceof Error ? e.message : e);
  }
  return pages;
}
