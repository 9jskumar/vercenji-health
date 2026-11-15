import type { Metadata } from "next";
import Link from "next/link";
import { contact, faqs } from "@/content/help";

export const metadata: Metadata = {
  title: "Help and contact",
  description: "Answers about orders, delivery, payments, returns and your Vercenji account, and how to reach us.",
};

export default function HelpPage() {
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-12 px-4 py-14 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="eyebrow">Help</div>
        <h1 className="m-0 font-serif text-[clamp(36px,5vw,56px)] leading-[1.05] font-normal text-forest">How can we help?</h1>
        <p className="m-0 max-w-[620px] text-lg leading-relaxed text-stone">
          Answers to common questions about orders, delivery and returns. Can&apos;t find what you need? Contact us below.
        </p>
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-12">
        <div className="flex flex-[1_1_560px] flex-col gap-10">
          {faqs.map((g) => (
            <section key={g.group} className="flex flex-col gap-3">
              <h2 className="m-0 font-serif text-2xl font-normal text-forest">{g.group}</h2>
              <div className="flex flex-col divide-y divide-line rounded-3xl bg-white ring-1 ring-line">
                {g.items.map((f) => (
                  <details key={f.q} className="group px-6 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-charcoal">
                      {f.q}
                      <span aria-hidden="true" className="text-xl text-green transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="m-0 mt-2.5 leading-relaxed text-stone">{f.a}</p>
                    {f.link && (
                      <Link href={f.link[1]} className="mt-2 inline-block text-sm font-bold text-green underline underline-offset-4">
                        {f.link[0]}
                      </Link>
                    )}
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside id="contact" className="flex flex-[1_1_300px] flex-col gap-5 self-start rounded-3xl bg-forest p-7 text-ivory">
          <h2 className="m-0 font-serif text-2xl font-normal">Contact us</h2>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold tracking-[0.14em] text-gold-light uppercase">Email</span>
            <a href={`mailto:${contact.email}`} className="text-ivory">{contact.email}</a>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold tracking-[0.14em] text-gold-light uppercase">Phone</span>
            <a href={contact.phoneHref} className="text-ivory">{contact.phone}</a>
          </div>
          <p className="m-0 text-sm leading-relaxed text-[#CFC8B8]">Please include your order number if your question is about an order.</p>
          <div className="flex flex-col gap-1 border-t border-forest-line pt-4">
            <span className="text-xs font-bold tracking-[0.14em] text-gold-light uppercase">Grievance officer</span>
            <span>{contact.grievance.name}</span>
            <a href={`mailto:${contact.grievance.email}`} className="text-ivory">{contact.grievance.email}</a>
          </div>
          {contact.address && (
            <div className="flex flex-col gap-1 border-t border-forest-line pt-4 text-sm text-[#CFC8B8]">
              <span className="text-xs font-bold tracking-[0.14em] text-gold-light uppercase">Registered office</span>
              <span>{contact.legalName}</span>
              <span>{contact.address}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
