import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { careersFacets, listOpenJobs, type JobFilters } from "@/lib/careers";
import { JobCard } from "@/components/careers/JobCard";
import { WhyIcon } from "@/components/careers/CareersIcons";
import { careersCopy, employmentTypeLabels, experienceLevelLabels, whyWorkWithUs } from "@/content/careers";
import { EmploymentType, ExperienceLevel } from "@/generated/prisma/enums";

const FILTER_KEYS = ["q", "department", "location", "type", "level", "page"] as const;

export async function generateMetadata({ searchParams }: PageProps<"/careers">): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = FILTER_KEYS.some((k) => sp[k]);
  return {
    title: { absolute: careersCopy.seoTitle },
    description: careersCopy.seoDescription,
    alternates: { canonical: "/careers" },
    // Filtered and paged views repeat the main page, so only /careers itself is indexed.
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: careersCopy.seoTitle, description: careersCopy.seoDescription, url: "/careers", type: "website", siteName: "Vercenji", images: ["/brand/vercenji-logo-green.png"] },
    twitter: { card: "summary", title: careersCopy.seoTitle, description: careersCopy.seoDescription },
  };
}

export default function CareersPage({ searchParams }: PageProps<"/careers">) {
  return (
    <>
      <section className="relative overflow-hidden bg-forest text-ivory">
        <div aria-hidden="true" className="absolute -top-[160px] -right-[160px] size-[560px] rounded-full border border-[#3E6A4A]" />
        <div aria-hidden="true" className="absolute -bottom-[200px] left-[30%] size-[420px] rounded-full border border-[#2E4A36]" />
        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-center gap-10 px-4 py-[72px] sm:px-6">
          <div className="flex flex-[1_1_520px] flex-col gap-5">
            <nav aria-label="Breadcrumb" className="text-sm text-[#CFC8B8]">
              <Link href="/" className="text-ivory">Home</Link> / Careers
            </nav>
            <div className="text-[13px] font-bold tracking-[0.18em] text-gold-light uppercase">{careersCopy.tagline}</div>
            <h1 className="m-0 font-serif text-[clamp(40px,5.5vw,68px)] leading-[1.04] font-normal">{careersCopy.heading}</h1>
            <p className="m-0 max-w-[600px] text-lg leading-relaxed text-[#DCE6DC]">{careersCopy.subheading}</p>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <a href="#openings" className="btn-light">Explore Opportunities</a>
              <Link href="/careers/future-opportunities" className="font-bold text-ivory underline underline-offset-4">Submit your profile</Link>
            </div>
          </div>
          <Image src="/brand/vercenji-emblem-gold.png" alt="" width={190} height={190} className="mx-auto opacity-90" />
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[900px] flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <Image src="/brand/vercenji-emblem-green.png" alt="" width={48} height={48} />
          <p className="m-0 font-serif text-[clamp(21px,2.6vw,28px)] leading-[1.45] text-forest">{careersCopy.intro}</p>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 pt-[80px] sm:px-6">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">Life at Vercenji</div>
          <h2 className="h2">Why work with us?</h2>
        </div>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-5">
          {whyWorkWithUs.map((w) => (
            <li key={w.title} className="card-lift flex flex-col gap-3 rounded-[22px] border border-line bg-white p-6">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-ivory text-green"><WhyIcon name={w.icon} size={34} /></span>
              <strong className="font-serif text-xl font-normal text-forest">{w.title}</strong>
              <span className="text-[15px] leading-relaxed text-[#45453F]">{w.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <Suspense fallback={<p className="mx-auto max-w-[1240px] px-6 py-16 text-stone">Loading current openings…</p>}>
        <Openings searchParams={searchParams} />
      </Suspense>

      <section className="mx-auto max-w-[1240px] px-4 py-[88px] sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-green p-8 text-ivory sm:p-12">
          <div className="flex max-w-[640px] flex-col gap-3">
            <h2 className="m-0 font-serif text-[clamp(28px,3.4vw,40px)] leading-tight font-normal">{careersCopy.speculativeTitle}</h2>
            <p className="m-0 leading-relaxed text-[#DCE6DC]">
              Don&apos;t see the right role? Share your CV and tell us where you would like to contribute. We keep profiles on file and may
              contact you when a suitable opportunity becomes available.
            </p>
          </div>
          <Link href="/careers/future-opportunities" className="btn-light">Submit Your Profile</Link>
        </div>
      </section>
    </>
  );
}

function pick<T extends string>(values: readonly T[], v: unknown): T | undefined {
  return values.find((x) => x === v);
}

async function Openings({ searchParams }: { searchParams: PageProps<"/careers">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim().slice(0, 80) : "");
  const facets = await careersFacets();
  const filters: JobFilters = {
    q: str("q") || undefined,
    department: facets.departments.some((d) => d.slug === str("department")) ? str("department") : undefined,
    location: str("location") === "remote" || facets.cities.includes(str("location")) ? str("location") : undefined,
    type: pick(Object.values(EmploymentType), str("type")),
    level: pick(Object.values(ExperienceLevel), str("level")),
    page: Math.max(1, Math.min(500, Number(str("page")) || 1)),
  };
  const filtered = !!(filters.q || filters.department || filters.location || filters.type || filters.level);
  const { jobs, total, page, pages } = facets.openCount ? await listOpenJobs(filters) : { jobs: [], total: 0, page: 1, pages: 1 };
  const qs = (over: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const all = { q: filters.q, department: filters.department, location: filters.location, type: filters.type, level: filters.level, ...over };
    for (const [k, v] of Object.entries(all)) if (v !== undefined && v !== "" && !(k === "page" && String(v) === "1")) u.set(k, String(v));
    const s = u.toString();
    return `/careers${s ? `?${s}` : ""}#openings`;
  };
  const groups = [
    { title: "Business verticals", items: facets.departments.filter((d) => d.group === "VERTICAL") },
    { title: "Teams and functions", items: facets.departments.filter((d) => d.group === "FUNCTION") },
  ];

  return (
    <>
      <section className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pt-[80px] sm:px-6">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">Job categories</div>
          <h2 className="h2">Find your place</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-3 rounded-[22px] bg-white p-6 ring-1 ring-line">
              <h3 className="m-0 text-xs font-bold tracking-[0.14em] text-stone uppercase">{g.title}</h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {g.items.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={qs({ department: d.slug, page: undefined, q: undefined, location: undefined, type: undefined, level: undefined })}
                      className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold no-underline ${
                        filters.department === d.slug ? "border-green bg-green text-white" : "border-line text-green hover:border-green"
                      }`}
                    >
                      {d.name}
                      <span className={`rounded-full px-2 text-xs ${filters.department === d.slug ? "bg-white/20" : "bg-ivory text-stone"}`}>{d.open}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="openings" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-6 px-4 pt-[80px] sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-2.5">
            <div className="eyebrow">Current openings</div>
            <h2 className="h2">Explore career opportunities</h2>
          </div>
          {facets.openCount > 0 && <span className="text-sm text-stone">{total} {total === 1 ? "vacancy" : "vacancies"}{filtered ? " match" : " open"}</span>}
        </div>

        {facets.openCount === 0 ? (
          <div className="flex flex-col items-start gap-5 rounded-[28px] border border-line bg-white p-8 sm:p-10">
            <p className="m-0 max-w-[760px] font-serif text-[22px] leading-relaxed text-forest">{careersCopy.emptyState}</p>
            <Link href="/careers/future-opportunities" className="btn-primary">{careersCopy.speculativeTitle}</Link>
          </div>
        ) : (
          <>
            <form action="/careers#openings" role="search" className="grid grid-cols-1 gap-3 rounded-[22px] bg-white p-4 ring-1 ring-line sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Keyword
                <input name="q" defaultValue={filters.q} placeholder="Job title, skill or reference" className="field py-2.5" />
              </label>
              <FilterSelect label="Department" name="department" value={filters.department} options={facets.departments.filter((d) => d.open > 0).map((d) => [d.slug, d.name])} />
              <FilterSelect
                label="Location"
                name="location"
                value={filters.location}
                options={[...facets.cities.map((c) => [c, c] as [string, string]), ...(facets.hasRemote ? [["remote", "Remote"] as [string, string]] : [])]}
              />
              <FilterSelect label="Employment type" name="type" value={filters.type} options={Object.entries(employmentTypeLabels)} />
              <FilterSelect label="Experience" name="level" value={filters.level} options={Object.entries(experienceLevelLabels)} />
              <div className="flex items-end gap-3">
                <button type="submit" className="btn-primary w-full py-2.5">Search</button>
              </div>
              {filtered && (
                <Link href="/careers#openings" className="text-sm font-semibold text-green underline sm:col-span-2 lg:col-span-6">Clear all filters</Link>
              )}
            </form>

            {jobs.length === 0 ? (
              <div className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-8">
                <p className="m-0 font-serif text-xl text-forest">No vacancies match your search.</p>
                <p className="m-0 text-stone">
                  Try fewer filters, or <Link href="/careers/future-opportunities" className="text-green underline">submit your profile for future opportunities</Link>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {jobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            )}

            {pages > 1 && (
              <nav aria-label="Pages" className="flex flex-wrap items-center gap-2 text-sm">
                {page > 1 && <Link href={qs({ page: page - 1 })} className="rounded-full border border-line bg-white px-4 py-2 font-semibold text-green no-underline">Previous</Link>}
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={qs({ page: n })}
                    aria-current={n === page ? "page" : undefined}
                    className={`flex size-10 items-center justify-center rounded-full font-semibold no-underline ${n === page ? "bg-green text-white" : "border border-line bg-white text-green"}`}
                  >
                    {n}
                  </Link>
                ))}
                {page < pages && <Link href={qs({ page: page + 1 })} className="rounded-full border border-line bg-white px-4 py-2 font-semibold text-green no-underline">Next</Link>}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value?: string; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      {label}
      <select name={name} defaultValue={value ?? ""} className="field py-2.5">
        <option value="">All</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
