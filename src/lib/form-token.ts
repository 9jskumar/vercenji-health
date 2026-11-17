import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// A signed "form opened at" stamp. Bots that post instantly, or replay an old form, are turned away
// without a CAPTCHA (no paid or third-party service needed).
const secret = process.env.APP_ENCRYPTION_KEY || process.env.SESSION_SECRET || randomBytes(32).toString("base64");

const sign = (purpose: string, ts: string) => createHmac("sha256", secret).update(`${purpose}:${ts}`).digest("base64url");

export function issueFormToken(purpose: string): string {
  const ts = String(Date.now());
  return `${ts}.${sign(purpose, ts)}`;
}

/** "ok", "too-fast" (under minMs since the form opened), or "invalid" (forged, or older than maxMs). */
export function checkFormToken(purpose: string, token: unknown, minMs = 4000, maxMs = 6 * 60 * 60 * 1000): "ok" | "too-fast" | "invalid" {
  if (typeof token !== "string") return "invalid";
  const [ts, mac] = token.split(".");
  if (!ts || !mac || !/^\d{13}$/.test(ts)) return "invalid";
  const expected = Buffer.from(sign(purpose, ts));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  const age = Date.now() - Number(ts);
  if (age < minMs) return "too-fast";
  if (age > maxMs) return "invalid";
  return "ok";
}
