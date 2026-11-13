"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/site";

export function MainNav() {
  const pathname = usePathname();
  return <NavList pathname={pathname} />;
}

/** Rendered without an active item while the current path is not known yet. */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-[1_1_520px] flex-wrap items-center gap-x-[26px] gap-y-1">
      {mainNav.map((item) => {
        const active = !!pathname && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 py-2.5 text-[15px] font-semibold no-underline ${
              active ? "border-gold text-green" : "border-transparent text-charcoal hover:text-green"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
