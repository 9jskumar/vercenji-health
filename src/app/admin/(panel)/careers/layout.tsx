import Link from "next/link";

const links = [
  ["/admin/careers", "Dashboard"],
  ["/admin/careers/jobs", "Vacancies"],
  ["/admin/careers/applications", "Candidates"],
  ["/admin/careers/settings", "Settings and templates"],
] as const;

export default function CareersAdminLayout({ children }: LayoutProps<"/admin/careers">) {
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Careers" className="flex flex-wrap gap-2 border-b border-line pb-4">
        <span className="mr-2 self-center text-xs font-bold tracking-[0.14em] text-gold-deep uppercase">Careers</span>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-green no-underline ring-1 ring-line hover:ring-green">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
