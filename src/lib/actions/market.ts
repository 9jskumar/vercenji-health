"use server";

import { cookies } from "next/headers";
import { MARKET_COOKIE, uaeStoreOpen } from "@/lib/market";

/** Switches the visitor between the India (INR) and UAE (AED) stores. */
export async function setMarket(form: FormData) {
  const code = form.get("market") === "AE" && (await uaeStoreOpen()) ? "AE" : "IN";
  (await cookies()).set(MARKET_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
