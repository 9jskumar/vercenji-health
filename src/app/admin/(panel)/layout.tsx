import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth/session";
import { staffLogout } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

async function StaffBar() {
  const staff = await requireStaff();
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-[#CFC8B8]">{staff.name ?? staff.email}</span>
      <form action={staffLogout}>
        <button type="submit" className="rounded-full border border-forest-line px-4 py-2 font-semibold text-ivory hover:bg-green">Sign out</button>
      </form>
    </div>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return <>{children}</>;
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-ivory">
      <header className="bg-forest text-ivory">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <Link href="/admin" className="flex items-center gap-3 no-underline">
            <Image src="/brand/vercenji-emblem-gold.png" alt="" width={36} height={36} />
            <span className="font-serif text-xl text-ivory">Vercenji Admin</span>
          </Link>
          <nav aria-label="Admin" className="flex flex-1 flex-wrap gap-5 text-sm font-semibold">
            <Link href="/admin" className="text-ivory">Overview</Link>
            <Link href="/admin/applications" className="text-ivory">Partner applications</Link>
            <Link href="/admin/products" className="text-ivory">Products</Link>
          </nav>
          <Suspense fallback={null}>
            <StaffBar />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 py-10">
        <Suspense fallback={<p className="text-stone">Loading…</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </main>
    </div>
  );
}
