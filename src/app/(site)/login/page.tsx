import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CustomerLoginForm } from "@/components/account/CustomerLoginForm";
import { getCustomer, safeNext } from "@/lib/auth/customer";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

async function LoginBody({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCustomer()) redirect(next);
  return <CustomerLoginForm next={next} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto flex max-w-[1240px] justify-center px-4 py-16">
      <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-[28px] bg-white p-8 ring-1 ring-line">
        <div className="flex flex-col gap-1.5">
          <div className="eyebrow">My account</div>
          <h1 className="m-0 font-serif text-3xl font-normal text-forest">Sign in or create an account</h1>
          <p className="m-0 text-[15px] leading-relaxed text-stone">
            Track your orders and request a return. Use the email you gave at checkout to see your past orders.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginBody searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
