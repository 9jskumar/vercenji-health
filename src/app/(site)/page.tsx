import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { VerticalIcon, TrustIcon, Tick } from "@/components/site/icons";
import { FeaturedProducts } from "@/components/catalogue/FeaturedProducts";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { trustClaims, confirmedTrust } from "@/content/trust";

const verticals = [
  { key: "nutrition", n: "01", title: "Nutrition & Supplements", body: "Ayurvedic-inspired and everyday nutrition, with transparent ingredients and sourcing.", cta: "Shop Supplements", href: "/nutrition" },
  { key: "ems", n: "02", title: "EMS Wellness", body: "Supervised EMS training sessions, plus professional EMS equipment for studios.", cta: "Discover EMS Wellness", href: "/ems" },
  { key: "water", n: "03", title: "Pure Drinking Water", body: "Drinking water for homes, offices and events, delivered on your schedule.", cta: "Order Drinking Water", href: "/water" },
  { key: "food", n: "04", title: "Healthy Food", body: "Balanced, freshly prepared meals and weekly plans from licensed partner kitchens.", cta: "Explore Healthy Meals", href: "/food" },
  { key: "lifestyle", n: "05", title: "Lifestyle & Wearables", body: "Activewear, wearables, bottles and accessories for active, healthy days.", cta: "Shop Lifestyle", href: "/lifestyle" },
] as const;

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 px-6 pt-14 pb-[72px]">
        <div className="flex flex-[1_1_460px] flex-col gap-[26px]">
          <div className="eyebrow">Integrated health &amp; wellness</div>
          <h1 className="m-0 font-serif text-[clamp(44px,6vw,80px)] leading-[1.02] font-normal tracking-[-0.02em] text-forest">
            Nourish. Move. Hydrate. Live.
          </h1>
          <p className="m-0 max-w-[520px] text-[19px] leading-relaxed text-[#45453F]">
            One wellness brand bringing together everyday nutrition, supervised EMS training, pure drinking water, healthy
            meals and an active lifestyle collection, in one connected experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/nutrition" className="btn-primary">Explore Products</Link>
            <Link href="/ems" className="btn-ghost">Discover EMS Wellness</Link>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2.5 p-0 pt-2 text-sm text-[#45453F]">
            {confirmedTrust.map((k) => (
              <li key={k} className="flex items-center gap-2">
                <Tick />
                {trustClaims[k].short}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex min-h-[420px] flex-[1_1_460px] items-center justify-center overflow-hidden rounded-[32px] bg-green md:min-h-[560px]">
          <div aria-hidden="true" className="absolute -top-[140px] -right-[180px] size-[640px] rounded-full border border-[#3E6A4A]" />
          <div aria-hidden="true" className="absolute -bottom-[160px] -left-[120px] size-[420px] rounded-full border border-[#3E6A4A]" />
          {/* Replaced by the lifestyle photograph or muted video once supplied. */}
          <Image src="/brand/vercenji-emblem-gold.png" alt="" width={220} height={220} className="relative opacity-95" priority />
        </div>
      </section>

      {/* Intro */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto flex max-w-[860px] flex-col items-center gap-5 px-6 py-[72px] text-center">
          <Image src="/brand/vercenji-emblem-green.png" alt="" width={56} height={56} />
          <p className="m-0 font-serif text-[clamp(24px,3vw,34px)] leading-[1.35] text-forest">
            Vercenji is a quality-first wellness house. We bring nutrition, movement, hydration and healthy food together, so
            better everyday choices are easier to make and easier to trust.
          </p>
          <Link href="/about" className="text-[15px] font-bold text-green underline underline-offset-4">Read our story</Link>
        </div>
      </section>

      {/* Five verticals */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-9 px-6 pt-[88px] pb-10">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">One brand, five verticals</div>
          <h2 className="h2">Your everyday journey towards better living</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {verticals.map((v) => {
            const Icon = VerticalIcon[v.key];
            return (
              <Link key={v.key} href={v.href} className="card-lift flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 no-underline">
                <div className="flex items-start justify-between text-green">
                  <Icon />
                  <span className="font-serif text-sm text-gold-deep">{v.n}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5">
                  <h3 className="m-0 font-serif text-[22px] leading-tight font-normal text-forest">{v.title}</h3>
                  <p className="m-0 flex-1 text-[15px] leading-relaxed text-stone">{v.body}</p>
                  <span className="text-sm font-bold text-green">{v.cta} →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products: renders only when approved, active products exist. */}
      <Suspense fallback={null}>
        <FeaturedProducts />
      </Suspense>

      {/* EMS spotlight */}
      <section className="mt-12 bg-forest text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 px-6 py-[88px]">
          <div className="flex min-h-[320px] flex-[1_1_420px] items-center justify-center rounded-[28px] border border-forest-line text-gold-light">
            <VerticalIcon.ems size={140} />
          </div>
          <div className="flex flex-[1_1_460px] flex-col gap-5">
            <div className="text-[13px] font-bold tracking-[0.18em] text-gold-light uppercase">EMS Wellness</div>
            <h2 className="m-0 font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-normal text-ivory">
              Supervised EMS training in focused sessions
            </h2>
            <p className="m-0 text-[17px] leading-relaxed text-[#CFC8B8]">
              Electrical muscle stimulation adds gentle impulses to guided exercises. Every session is led by a trained coach,
              after a short eligibility screening.
            </p>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {["Complete the safety screening and consent online", "Train in a fitted suit with your coach beside you", "Track your sessions in your account"].map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold-light font-serif text-gold-light">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Link href="/ems#register" className="btn-light">Register interest in a trial</Link>
              <Link href="/ems/equipment" className="font-bold text-ivory underline underline-offset-4">EMS equipment for studios</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Food and water, Release B: interest only until the pilots open. */}
      <section className="mx-auto grid max-w-[1240px] grid-cols-1 gap-5 px-6 pt-[88px] md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-8">
          <div className="eyebrow">Healthy food</div>
          <h2 className="m-0 font-serif text-[32px] leading-tight font-normal text-forest">Balanced meals, every ingredient listed</h2>
          <p className="m-0 leading-relaxed text-stone">
            Freshly prepared meals and weekly plans you can pause or skip, with ingredients and allergens shown for every dish.
          </p>
          <Link href="/food" className="btn-ghost self-start">Explore Healthy Meals</Link>
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-8">
          <div className="eyebrow">Pure drinking water</div>
          <h2 className="m-0 font-serif text-[32px] leading-tight font-normal text-forest">Delivered on your schedule</h2>
          <p className="m-0 leading-relaxed text-stone">
            From 500 ml bottles to household containers, for homes, offices and events, with one-off and repeat orders.
          </p>
          <Link href="/water" className="btn-ghost self-start">Order Drinking Water</Link>
        </div>
      </section>

      {/* Partner */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-7 px-6 pt-[88px] pb-14">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">Partner with Vercenji</div>
          <h2 className="h2">Grow with a connected wellness brand</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-3xl bg-green p-9 text-ivory">
            <h3 className="m-0 font-serif text-[28px] font-normal">Wellness and franchise partners</h3>
            <p className="m-0 leading-relaxed text-[#DCE6DC]">
              Wellness Hub, Wellness Corner and Home Diet &amp; Nutrition partnerships for entrepreneurs and investors.
              Applications are reviewed individually; details are shared after initial discussions.
            </p>
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Link href="/partner#apply" className="btn-light">Become a Partner</Link>
              <Link href="/partner" className="font-bold text-ivory underline underline-offset-4">Explore Franchise Opportunities</Link>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-9">
            <h3 className="m-0 font-serif text-[28px] font-normal text-forest">Start your own healthy cloud kitchen</h3>
            <p className="m-0 leading-relaxed text-stone">
              For licensed kitchens and food entrepreneurs who want to prepare Vercenji menus with our recipes, specifications
              and ordering platform.
            </p>
            <Link href="/partner?model=CLOUD_KITCHEN#apply" className="btn-primary self-start">Apply as a kitchen partner</Link>
          </div>
        </div>
        <p className="m-0 text-[13px] leading-relaxed text-stone">
          Submitting an application does not create a franchise, partnership, territory right or any obligation. Vercenji does
          not promise or guarantee any income, profit or return on investment.
        </p>
      </section>

      {/* Quality and trust: only confirmed commitments are shown. */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-[72px]">
        <div className="flex flex-col gap-2.5">
          <div className="eyebrow">Quality and trust</div>
          <h2 className="h2">Our quality commitments</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {confirmedTrust.map((k) => {
            const Icon = TrustIcon[k];
            return (
              <div key={k} className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-6 text-green">
                <Icon />
                <h3 className="m-0 font-serif text-xl font-normal text-forest">{trustClaims[k].title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-stone">{trustClaims[k].body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-[1240px] px-6 pb-[88px]">
        <div className="flex flex-wrap items-center gap-8 rounded-[28px] bg-white p-10 ring-1 ring-line">
          <div className="flex flex-[1_1_360px] flex-col gap-3">
            <h2 className="m-0 font-serif text-[32px] font-normal text-forest">Join the Vercenji community</h2>
            <p className="m-0 leading-relaxed text-stone">
              Be first to hear about launches, new studios and seasonal menus. We only send marketing messages if you tick the box.
            </p>
          </div>
          <div className="flex-[1_1_420px]">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
