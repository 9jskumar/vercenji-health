import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CartCount } from "./CartCount";
import { MainNav, NavList } from "./MainNav";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-line bg-white text-charcoal">
      <div className="bg-forest text-xs tracking-[0.02em] text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-2">
          <span>Integrated health &amp; wellness · Nourish. Move. Hydrate. Live.</span>
          <span className="flex flex-wrap gap-[18px]">
            <span>India · ₹ INR</span>
            <Link href="/account/orders" className="text-ivory no-underline">
              Track order
            </Link>
            <Link href="/help" className="text-ivory no-underline">
              Help
            </Link>
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3.5">
        <Link href="/" aria-label="Vercenji home" className="flex shrink-0 items-center">
          <Image
            src="/brand/vercenji-logo-green.png"
            alt="Vercenji"
            width={120}
            height={52}
            priority
            className="h-[52px] w-auto"
          />
        </Link>
        <Suspense fallback={<NavList pathname={null} />}>
          <MainNav />
        </Suspense>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/search" aria-label="Search" className="flex size-11 items-center justify-center rounded-full text-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </Link>
          <Link href="/login" aria-label="Account" className="flex size-11 items-center justify-center rounded-full text-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex h-11 items-center gap-2 rounded-full bg-green pr-3.5 pl-3 text-sm font-semibold text-white no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <Suspense fallback={<span>0</span>}>
              <CartCount />
            </Suspense>
          </Link>
        </div>
      </div>
    </header>
  );
}
