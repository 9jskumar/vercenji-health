import "server-only";
import { headers } from "next/headers";

/** Client IP as reported by the hosting proxy. Used only for rate limiting and audit. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 45);
}
