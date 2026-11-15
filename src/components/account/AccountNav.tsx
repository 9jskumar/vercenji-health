import Link from "next/link";
import { customerLogout } from "@/lib/actions/customer-auth";

const links = [
  ["/account", "Overview"],
  ["/account/orders", "My orders"],
  ["/account/returns", "Returns"],
] as const;

export function AccountNav({ current }: { current: (typeof links)[number][0] }) {
  return (
    <nav aria-label="Account" className="flex flex-wrap items-center gap-2">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold no-underline ${current === href ? "bg-green text-white" : "bg-white text-charcoal ring-1 ring-line"}`}
        >
          {label}
        </Link>
      ))}
      <form action={customerLogout} className="ml-auto">
        <button type="submit" className="text-sm font-bold text-green underline underline-offset-4">Sign out</button>
      </form>
    </nav>
  );
}
