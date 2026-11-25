import "server-only";
import { cookies } from "next/headers";
import { getStaff } from "@/lib/auth/session";
import { stripeEnabled, stripeTestMode } from "@/lib/stripe";

/**
 * Vercenji sells in two stores. India prices in INR and takes payment through Razorpay (Verde Centric
 * Energy LLP). The UAE store prices in AED and takes payment through Stripe (the UAE company).
 * A product appears in a store only when it has an option on sale in that store's currency.
 */
export const MARKETS = {
  IN: { code: "IN", label: "India", currency: "INR", gateway: "razorpay", taxName: "GST" },
  AE: { code: "AE", label: "UAE", currency: "AED", gateway: "stripe", taxName: "VAT" },
} as const;
export type MarketCode = keyof typeof MARKETS;
export type Market = (typeof MARKETS)[MarketCode];

export const MARKET_COOKIE = "vh_market";

/**
 * The UAE store is offered once Stripe keys are set. With Stripe test keys it is offered only to staff
 * signed in to the admin in the same browser, so the public never meets a test checkout.
 */
export async function uaeStoreOpen() {
  if (!stripeEnabled()) return false;
  if (!stripeTestMode()) return true;
  return (await getStaff()) !== null;
}

export async function getMarket(): Promise<Market> {
  const chosen = (await cookies()).get(MARKET_COOKIE)?.value;
  if (chosen === "AE" && (await uaeStoreOpen())) return MARKETS.AE;
  return MARKETS.IN;
}

/**
 * The UAE company that sells through the UAE store under the Vercenji brand. Set on the server
 * (cPanel → Setup Node.js App → Environment variables) so the owner can fill them in without a new upload.
 */
export function uaeSeller() {
  const v = (k: string) => process.env[k]?.trim() || null;
  return {
    name: v("UAE_COMPANY_NAME"),
    tradeLicence: v("UAE_TRADE_LICENCE"),
    trn: v("UAE_TRN"),
    address: v("UAE_COMPANY_ADDRESS"),
    deliveryDays: v("UAE_DELIVERY_DAYS"),
  };
}
