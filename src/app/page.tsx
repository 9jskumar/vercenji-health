import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

// Temporary home page. The full approved home design is ported in a later step.
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-ivory">
        <section className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 py-24">
          <p className="text-xs font-bold tracking-[0.14em] text-gold-deep uppercase">Vercenji Health</p>
          <h1 className="max-w-3xl font-serif text-5xl leading-tight font-light text-forest">
            Wellness that moves with you.
          </h1>
          <p className="max-w-xl text-lg text-stone">Nourish. Move. Hydrate. Live.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/nutrition" className="rounded-full bg-green px-6 py-3 font-semibold text-white">
              Explore products
            </Link>
            <Link href="/partner" className="rounded-full border border-green px-6 py-3 font-semibold text-green">
              Become a partner
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
