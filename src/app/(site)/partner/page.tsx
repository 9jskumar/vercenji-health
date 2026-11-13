import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PartnerApplicationForm } from "@/components/partner/PartnerApplicationForm";
import { PickModelButton } from "@/components/partner/PickModelButton";
import { partnerFaqs, partnerModels, processSteps } from "@/content/partner";

export const metadata: Metadata = {
  title: "Partner with Vercenji: wellness hub, cloud kitchen and franchise enquiries",
  description:
    "Apply to partner with Vercenji as a Wellness Hub, Wellness Corner, Home Diet & Nutrition or Cloud Kitchen partner. Every application is reviewed personally.",
  alternates: { canonical: "/partner" },
};

export default function PartnerPage() {
  return (
    <>
      <section className="bg-forest text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-10 px-6 py-[72px]">
          <div className="flex flex-[1_1_520px] flex-col gap-5">
            <nav aria-label="Breadcrumb" className="text-sm text-[#CFC8B8]">
              <Link href="/" className="text-ivory">Home</Link> / Partner with Vercenji
            </nav>
            <h1 className="m-0 font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] font-normal">Partner with Vercenji</h1>
            <p className="m-0 max-w-[560px] text-lg leading-relaxed text-[#DCE6DC]">
              One wellness brand, five verticals and several ways to build a business with us. Tell us about yourself and the
              model that interests you; our partnerships team reviews every application personally.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <a href="#apply" className="btn-light">Become a Partner</a>
              <a href="#models" className="font-bold text-ivory underline underline-offset-4">Explore Franchise Opportunities</a>
            </div>
          </div>
          <Image src="/brand/vercenji-emblem-gold.png" alt="" width={200} height={200} className="mx-auto opacity-90" />
        </div>
      </section>

      <section id="models" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-8 px-6 pt-[88px]">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">Partnership models</div>
          <h2 className="h2">Choose the model that suits you</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerModels.map((m) => (
            <div key={m.id} id={m.anchor} className="flex scroll-mt-6 flex-col gap-2.5 rounded-[22px] border border-line bg-white p-6">
              <h3 className="m-0 font-serif text-2xl font-normal text-forest">{m.name}</h3>
              <p className="m-0 leading-relaxed text-[#45453F]">{m.desc}</p>
              <span className="text-sm text-stone"><strong>Suits:</strong> {m.suits}</span>
              <span className="pb-2 text-sm text-gold-deep">Investment: shared after initial discussions</span>
              <PickModelButton model={m.id}>Apply for this model</PickModelButton>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 pt-[88px]">
        <h2 className="h2">How the process works</h2>
        <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-2 rounded-[22px] bg-white p-5 ring-1 ring-line">
              <span className="flex size-9 items-center justify-center rounded-full bg-green font-serif text-white">{i + 1}</span>
              <strong className="text-forest">{title}</strong>
              <span className="text-sm text-stone">{body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="apply" className="mx-auto max-w-[920px] scroll-mt-6 px-6 pt-[88px]">
        <div className="rounded-[28px] bg-white p-6 ring-1 ring-line sm:p-10">
          <Suspense fallback={<p className="text-stone">Loading the application form…</p>}>
            <PartnerApplicationForm />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto flex max-w-[920px] flex-col gap-4 px-6 py-[88px]">
        <h2 className="h2">Partnership questions</h2>
        {partnerFaqs.map(([q, a]) => (
          <details key={q} className="group rounded-2xl bg-white p-5 ring-1 ring-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-forest">
              {q}
              <span aria-hidden="true" className="text-xl text-gold group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-xl text-gold group-open:inline">−</span>
            </summary>
            <p className="m-0 pt-3 leading-relaxed text-[#45453F]">{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
