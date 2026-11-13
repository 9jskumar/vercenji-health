import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default function AdminLogin() {
  return (
    <main className="flex flex-1 items-center justify-center bg-ivory px-4 py-16">
      <div className="flex w-full max-w-[420px] flex-col gap-6 rounded-[28px] bg-white p-8 ring-1 ring-line">
        <Image src="/brand/vercenji-logo-green.png" alt="Vercenji" width={110} height={48} className="h-12 w-auto self-start" />
        <div>
          <h1 className="m-0 font-serif text-3xl font-normal text-forest">Staff sign in</h1>
          <p className="m-0 mt-1 text-sm text-stone">For Vercenji team members only.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
