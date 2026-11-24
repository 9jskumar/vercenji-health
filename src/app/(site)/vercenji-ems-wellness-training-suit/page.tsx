import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoRequestForm } from "@/components/ems/DemoRequestForm";
import {
  audiences,
  businessFlow,
  EMS_PATH,
  emsSeo,
  faqs,
  heroFacts,
  innovations,
  kit,
  kitOptions,
  muscleGroups,
  programmeNote,
  programmes,
  safety,
  specs,
  steps,
} from "@/content/ems";
import { company, isLive } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: emsSeo.title },
  description: emsSeo.description,
  alternates: { canonical: EMS_PATH },
  openGraph: {
    type: "website",
    url: EMS_PATH,
    siteName: "Vercenji Health",
    title: emsSeo.title,
    description: emsSeo.description,
    locale: "en_IN",
    images: [{ url: "/images/ems/og-ems.jpg", width: 1200, height: 630, alt: "Vercenji EMS suit worn during a workout in a gym" }],
  },
  twitter: { card: "summary_large_image", title: emsSeo.title, description: emsSeo.description, images: ["/images/ems/og-ems.jpg"] },
};

// Decorative line icons in the style of the site's vertical icons.
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const icons: Record<string, React.ReactNode> = {
  app: (<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" {...stroke}><rect x="14" y="5" width="20" height="38" rx="4" /><path d="M21 37h6" /><path d="M19 22l4-6 3 9 3-5" /></svg>),
  harness: (<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" {...stroke}><path d="M10 14h28v10a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z" /><path d="M16 30v12M32 30v12M18 14V6M30 14V6" /></svg>),
  fit: (<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" {...stroke}><path d="M17 6l-9 5 3 8 4-2v23h18V17l4 2 3-8-9-5c-1 3-4 5-7 5s-6-2-7-5z" /><path d="M15 27h18" /></svg>),
  battery: (<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" {...stroke}><rect x="6" y="14" width="32" height="20" rx="3" /><path d="M42 21v6" /><path d="M23 18l-5 7h7l-4 6" /></svg>),
};

function JsonLd() {
  const url = `${process.env.SITE_URL ?? "https://vercenji.com"}${EMS_PATH}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Vercenji EMS Wellness Training Suit",
      description: emsSeo.description,
      brand: { "@type": "Brand", name: "Vercenji" },
      category: "Electrical muscle stimulation (EMS) training equipment",
      image: [`${url.replace(EMS_PATH, "")}/images/ems/suit-491.webp`, `${url.replace(EMS_PATH, "")}/images/ems/og-ems.jpg`],
      url,
      manufacturer: { "@type": "Organization", name: company.legalName },
      additionalProperty: specs.map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url.replace(EMS_PATH, "/") },
        { "@type": "ListItem", position: 2, name: "EMS Wellness", item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function SectionHead({ eyebrow, title, intro, light }: { eyebrow: string; title: string; intro?: string; light?: boolean }) {
  return (
    <div className="flex max-w-[760px] flex-col gap-3">
      <div className={light ? "text-[13px] font-bold tracking-[0.18em] text-gold-light uppercase" : "eyebrow"}>{eyebrow}</div>
      <h2 className={light ? "m-0 font-serif text-[clamp(30px,3.6vw,44px)] leading-[1.1] font-normal text-ivory" : "h2"}>{title}</h2>
      {intro && <p className={`m-0 text-[17px] leading-relaxed ${light ? "text-[#CFC8B8]" : "text-stone"}`}>{intro}</p>}
    </div>
  );
}

export default function EmsWellnessPage() {
  if (!isLive("ems")) notFound();
  return (
    <>
      <JsonLd />

      {/* A. Hero */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-12 gap-y-10 px-6 pt-10 pb-16 md:pt-14 md:pb-20">
          <div className="flex flex-[1_1_520px] flex-col gap-6">
            <nav aria-label="Breadcrumb" className="text-sm text-[#CFC8B8]">
              <Link href="/" className="text-ivory">Home</Link> / EMS Wellness
            </nav>
            <div className="text-[13px] font-bold tracking-[0.18em] text-gold-light uppercase">Professional EMS equipment</div>
            <h1 className="m-0 font-serif text-[clamp(42px,6vw,76px)] leading-[1.02] font-normal">
              Vercenji <span className="text-gold-light">EMS Wellness</span>
            </h1>
            <p className="m-0 font-serif text-[clamp(20px,2.2vw,26px)] leading-snug text-ivory/90">
              The workout evolution: full-body training in focused 20-minute sessions.
            </p>
            <p className="m-0 max-w-[580px] text-[17px] leading-relaxed text-[#DCE6DC]">
              A wireless electrical muscle stimulation (EMS) suit for commercial gyms, EMS studios, personal trainers and wellness
              centres. It works 10 muscle groups at once while your clients move, under your supervision.
            </p>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <a href="#demo" className="btn-light">Request a demo</a>
              <a href="#technology" className="font-bold text-ivory underline underline-offset-4">Explore the technology</a>
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-[420px] flex-[1_1_320px] justify-center">
            <div aria-hidden="true" className="absolute inset-x-6 top-10 bottom-0 rounded-[40px] bg-gradient-to-b from-gold/30 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] bg-[#E9E9EC] p-6 ring-1 ring-gold/40">
              <Image
                src="/images/ems/suit-491.webp"
                alt="The Vercenji EMS training suit: a black zip-front vest with adjustable straps, the gold Vercenji emblem on the waist belt, and electrode shorts with thigh straps"
                width={491}
                height={788}
                priority
                unoptimized
                className="h-auto w-full max-w-[340px]"
              />
            </div>
          </div>
        </div>
        <div className="border-t border-forest-line">
          <dl className="mx-auto m-0 grid max-w-[1240px] grid-cols-2 gap-px px-6 md:grid-cols-4">
            {heroFacts.map(([n, l]) => (
              <div key={l} className="flex flex-col gap-1 py-6">
                <dt className="order-2 text-sm text-[#CFC8B8]">{l}</dt>
                <dd className="order-1 m-0 font-serif text-3xl text-gold-light">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* B. Introduction */}
      <section id="technology" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-10 px-6 pt-[88px]">
        <SectionHead
          eyebrow="The technology"
          title="What is EMS training?"
          intro="Electrical muscle stimulation sends small electrical impulses through electrodes in the suit. The impulses make muscles contract, much like the signals your nerves send, while the client performs simple guided movements."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["How it works", "Electrodes over each muscle group deliver impulses that the trainer sets per channel. Combined with movement, several muscle groups work at the same time."],
            ["A focused session", "Sessions last about 20 minutes. The trainer chooses the programme and adjusts the intensity from 0 to 100 as the client warms up."],
            ["Where it fits", "EMS is used in fitness and conditioning programmes, alongside regular activity, rest and balanced nutrition. It complements training; it does not replace it."],
          ].map(([t, b]) => (
            <div key={t} className="card-lift flex flex-col gap-3 rounded-[22px] bg-white p-7 ring-1 ring-line">
              <h3 className="m-0 font-serif text-2xl font-normal text-forest">{t}</h3>
              <p className="m-0 leading-relaxed text-[#45453F]">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Muscle group coverage */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 pt-[88px]">
        <SectionHead
          eyebrow="Coverage"
          title="10 muscle groups in one session"
          intro="Traditional workouts often take an hour or more. The Vercenji suit targets the main muscle groups of the upper body, lower body and core at the same time."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {muscleGroups.map((m, i) => (
            <div key={m.region} className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-6">
              <span className="font-serif text-sm text-gold-deep">0{i + 1}</span>
              <h3 className="m-0 text-base font-bold text-forest">{m.region}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-[#45453F]">{m.muscles}</p>
            </div>
          ))}
        </div>
        <p className="m-0 rounded-2xl bg-[#EFE8D8] p-4 text-[15px] text-[#45453F]">
          <strong className="text-forest">Electrode pads</strong> are movable, expandable and individually replaceable, so the suit can be
          adjusted to each client and serviced one part at a time.
        </p>
      </section>

      {/* Key innovations */}
      <section className="mt-[88px] bg-forest text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-[88px]">
          <SectionHead light eyebrow="Built for studios" title="Key features and commercial advantages" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {innovations.map((f) => (
              <div key={f.key} className="flex gap-5 rounded-[22px] border border-forest-line p-7">
                <span className="shrink-0 text-gold-light">{icons[f.key]}</span>
                <div className="flex flex-col gap-2">
                  <h3 className="m-0 font-serif text-2xl font-normal text-ivory">{f.title}</h3>
                  <p className="m-0 leading-relaxed text-[#DCE6DC]">{f.body}</p>
                  {"detail" in f && <p className="m-0 text-sm leading-relaxed text-[#CFC8B8]">{f.detail}</p>}
                </div>
              </div>
            ))}
          </div>
          <div id="programmes" className="flex scroll-mt-6 flex-col gap-4 rounded-[22px] border border-forest-line p-7">
            <h3 className="m-0 font-serif text-2xl font-normal text-ivory">12 preset programmes and a VIP mode</h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {programmes.map((p) => (
                <li key={p} className="rounded-full border border-gold-light/50 px-4 py-1.5 text-sm text-ivory">{p}</li>
              ))}
              <li className="rounded-full bg-gold-light px-4 py-1.5 text-sm font-semibold text-forest">VIP (customisable)</li>
            </ul>
            <p className="m-0 text-sm text-[#CFC8B8]">{programmeNote}</p>
          </div>
        </div>
      </section>

      {/* C. Benefits, with evidence stated honestly */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 pt-[88px]">
        <SectionHead
          eyebrow="Benefits"
          title="What EMS can offer your clients"
          intro="We describe EMS carefully. Here is what is well understood, what research suggests, and what depends on the individual."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Well established", "Electrical impulses make muscles contract. Muscle stimulation has been used in sports and rehabilitation settings for decades, under professional guidance."],
            ["What research suggests", "Studies of supervised whole-body EMS have reported gains in muscle strength for some groups of people when combined with exercise. Findings differ between studies and populations."],
            ["What varies", "Results depend on the person, their health, how often they train, their activity and their nutrition. We do not promise specific results such as weight loss or body-shape changes."],
          ].map(([t, b], i) => (
            <div key={t} className="flex flex-col gap-3 rounded-[22px] bg-white p-7 ring-1 ring-line">
              <span className={`self-start rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${["bg-[#DCE6DC] text-forest", "bg-[#FBF1DC] text-[#7A5A1E]", "bg-[#EEEEEC] text-stone"][i]}`}>{t}</span>
              <p className="m-0 leading-relaxed text-[#45453F]">{b}</p>
            </div>
          ))}
        </div>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {["Time-efficient sessions of about 20 minutes", "Several muscle groups trained together", "Intensity tailored to each client", "Low-impact movements"].map((b) => (
            <li key={b} className="flex items-center gap-3 rounded-2xl bg-[#EFE8D8] px-4 py-3 text-[15px] font-semibold text-forest">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green text-xs text-white">✓</span>
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* D. Training experience */}
      <section className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-12 px-6 pt-[88px]">
        <div className="flex flex-[1_1_480px] flex-col gap-8">
          <SectionHead eyebrow="The experience" title="Five steps to a session" intro="Set-up takes a few minutes. Here is how a typical session runs." />
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {steps.map(([t, b], i) => (
              <li key={t} className="flex gap-4 rounded-[22px] bg-white p-5 ring-1 ring-line">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green font-serif text-lg text-white">{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 text-base font-bold text-forest">{t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#45453F]">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="m-0 flex flex-[1_1_360px] flex-col gap-3 md:sticky md:top-6">
          <Image
            src="/images/ems/training-928.webp"
            alt="A man wearing the Vercenji EMS suit trains with battle ropes in a gym"
            width={928}
            height={1152}
            unoptimized
            className="h-auto w-full rounded-[28px] ring-1 ring-line"
          />
          <figcaption className="text-sm text-stone">Movements stay simple. The suit adds the stimulation.</figcaption>
        </figure>
      </section>

      {/* Visual band */}
      <section className="mx-auto max-w-[1240px] px-6 pt-[88px]">
        <Image
          src="/images/ems/banner-1376.webp"
          alt="Vercenji EMS suit banner: a man in the suit in a modern gym, with the words The ultimate workout evolution, 20-minute full body stimulation"
          width={1376}
          height={768}
          unoptimized
          className="h-auto w-full rounded-[28px]"
        />
      </section>

      {/* Specifications */}
      <section id="specifications" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-8 px-6 pt-[88px]">
        <SectionHead eyebrow="Specifications" title="Technical specifications" />
        <div className="overflow-hidden rounded-[22px] bg-white ring-1 ring-line">
          <table className="w-full border-collapse text-left text-[15px]">
            <caption className="sr-only">Vercenji EMS suit technical specifications</caption>
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-t border-line first:border-t-0">
                  <th scope="row" className="w-[38%] bg-ivory/60 p-4 align-top font-semibold text-forest">{k}</th>
                  <td className="p-4 text-[#45453F]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* E. Who it is for */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 pt-[88px]">
        <SectionHead eyebrow="Who it is for" title="Made for professionals who train others" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {audiences.map(([t, b]) => (
            <div key={t} className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-6">
              <h3 className="m-0 text-base font-bold text-forest">{t}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-[#45453F]">{b}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-[22px] bg-[#EFE8D8] p-6">
          <h3 className="m-0 text-base font-bold text-forest">How EMS fits a studio business</h3>
          <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[15px]">
            {businessFlow.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-white px-4 py-2 font-semibold text-forest ring-1 ring-line">{s}</span>
                {i < businessFlow.length - 1 && <span aria-hidden="true" className="text-gold-deep">→</span>}
              </li>
            ))}
          </ol>
          <p className="m-0 text-sm text-stone">Returns depend on your pricing, location and client numbers. We can talk through your plans during the demo.</p>
        </div>
      </section>

      {/* F. Packages */}
      <section id="packages" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-8 px-6 pt-[88px]">
        <SectionHead eyebrow="Packages" title="Standard commercial kit" intro="Everything a studio needs to start running sessions. Prices depend on fit option, quantity and customisation, and are shared on request." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-5 rounded-[28px] bg-white p-7 ring-1 ring-line sm:p-9">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="m-0 font-serif text-3xl font-normal text-forest">In the box</h3>
              <span className="rounded-full bg-[#FBF1DC] px-3 py-1 text-sm font-semibold text-[#7A5A1E]">Price on request</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {kit.map((k) => (
                <li key={k} className="flex items-start gap-3 text-[15px] text-[#45453F]">
                  <span aria-hidden="true" className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-green text-[10px] text-white">✓</span>
                  {k}
                </li>
              ))}
            </ul>
            <a href="#demo" className="btn-primary self-start">Get a studio quote</a>
          </div>
          <div className="flex flex-col gap-4">
            {kitOptions.map(([t, b]) => (
              <div key={t} className="flex flex-col gap-2 rounded-[22px] border border-gold/50 bg-[#FBF7EE] p-6">
                <span className="text-xs font-bold tracking-wide text-gold-deep uppercase">Optional</span>
                <h3 className="m-0 font-serif text-2xl font-normal text-forest">{t}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#45453F]">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* G. Safety */}
      <section id="safety" className="mx-auto max-w-[1240px] scroll-mt-6 px-6 pt-[88px]">
        <div className="flex flex-wrap gap-10 rounded-[28px] bg-white p-7 ring-1 ring-line sm:p-10">
          <div className="flex flex-[1_1_320px] flex-col gap-3">
            <div className="eyebrow">Safety and guidance</div>
            <h2 className="h2">Safety comes before every session</h2>
            <p className="m-0 leading-relaxed text-stone">
              EMS is not suitable for everyone and is not a medical treatment or a substitute for medical advice. Check each client&apos;s
              suitability before their first session and follow the operation manual supplied with the suit.
            </p>
          </div>
          <ul className="m-0 flex flex-[1_1_420px] list-none flex-col gap-3 p-0">
            {safety.map((s) => (
              <li key={s} className="flex items-start gap-3 rounded-2xl bg-ivory p-4 text-[15px] text-[#45453F]">
                <span aria-hidden="true" className="mt-0.5 font-bold text-gold-deep">!</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* H. FAQ */}
      <section id="faq" className="mx-auto flex max-w-[920px] scroll-mt-6 flex-col gap-4 px-6 pt-[88px]">
        <h2 className="h2">Frequently asked questions</h2>
        {faqs.map(([q, a]) => (
          <details key={q} className="group rounded-2xl bg-white p-5 ring-1 ring-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-forest">
              <h3 className="m-0 text-base font-semibold">{q}</h3>
              <span aria-hidden="true" className="text-xl text-gold group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-xl text-gold group-open:inline">−</span>
            </summary>
            <p className="m-0 pt-3 leading-relaxed text-[#45453F]">{a}</p>
          </details>
        ))}
      </section>

      {/* I. Conversion */}
      <section id="demo" className="mt-[88px] scroll-mt-0 bg-forest">
        <div className="mx-auto flex max-w-[1240px] flex-wrap gap-10 px-6 py-[88px]">
          <div className="flex flex-[1_1_340px] flex-col gap-5 text-ivory">
            <div className="text-[13px] font-bold tracking-[0.18em] text-gold-light uppercase">Request a demo</div>
            <h2 className="m-0 font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-normal">Bring Vercenji EMS to your studio</h2>
            <p className="m-0 text-[17px] leading-relaxed text-[#CFC8B8]">
              See the suit and app in action, ask about fit options and branding, and get a quotation for your studio.
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
              <li>Email: <a href={`mailto:${company.enquiryEmail}`} className="font-semibold text-gold-light underline">{company.enquiryEmail}</a></li>
              <li>Phone: <a href={`tel:${company.supportPhone.replace(/\s/g, "")}`} className="font-semibold text-gold-light underline">{company.supportPhone}</a></li>
              <li>Opening a studio? See <Link href="/partner" className="font-semibold text-gold-light underline">partnership models</Link>.</li>
            </ul>
          </div>
          <div className="flex-[1_1_520px] rounded-[28px] bg-white p-6 sm:p-9">
            <DemoRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
