import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalPage, legalPages } from "@/content/legal";

export function generateStaticParams() {
  return legalPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const page = getLegalPage((await params).slug);
  if (!page) return {};
  // Drafts stay out of search results until the owner approves them.
  return { title: page.title, description: page.summary, robots: page.approved ? undefined : { index: false } };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const page = getLegalPage((await params).slug);
  if (!page) notFound();

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-8 px-6 pt-10 pb-[88px]">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">Legal</span>
        <h1 className="m-0 font-serif text-5xl font-normal text-forest">{page.title}</h1>
        <p className="m-0 text-lg text-stone">{page.summary}</p>
        <p className="m-0 text-sm text-stone">Version {page.version}</p>
      </div>

      {!page.approved && (
        <aside role="note" className="flex flex-col gap-2 rounded-2xl bg-[#FBF1DC] p-5 text-[15px] text-[#7A5A1E]">
          <strong>Draft for review.</strong>
          <span>This wording has not been approved yet. To be confirmed:</span>
          <ul className="m-0 list-disc pl-5">
            {page.toConfirm.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </aside>
      )}

      <div className="flex flex-col gap-8 rounded-3xl bg-white p-8 ring-1 ring-line">
        {page.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-3">
            <h2 className="m-0 font-serif text-2xl font-normal text-forest">{s.heading}</h2>
            {s.body.map((b, i) =>
              Array.isArray(b) ? (
                <ul key={i} className="m-0 flex list-disc flex-col gap-2 pl-5 leading-relaxed">
                  {b.map((li) => <li key={li}>{li}</li>)}
                </ul>
              ) : (
                <p key={i} className="m-0 leading-relaxed">{b}</p>
              ),
            )}
          </section>
        ))}
      </div>

      <nav aria-label="Other policies" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {legalPages.filter((p) => p.slug !== page.slug).map((p) => (
          <Link key={p.slug} href={`/legal/${p.slug}`} className="font-semibold text-green underline">{p.title}</Link>
        ))}
      </nav>
    </div>
  );
}
