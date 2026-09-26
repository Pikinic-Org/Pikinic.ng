import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

// Signed, expiring download tokens for the free guide. Stateless: the token
// carries the lead id and an expiry, and is verified with the same secret the
// admin session uses, so no extra configuration is needed.
//
// Format: <leadId>.<expiresAtMs>.<hmac>

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  return process.env.AUTH_SECRET ?? requireEnv("NEXTAUTH_SECRET")[0];
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(`guide-download:${payload}`).digest("base64url");
}

export function createGuideToken(leadId: string, ttlMs = DEFAULT_TTL_MS) {
  const payload = `${leadId}.${Date.now() + ttlMs}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the lead id when the token is authentic and unexpired, otherwise null. */
export function verifyGuideToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [leadId, expiresAt, signature] = parts;
  const expected = sign(`${leadId}.${expiresAt}`);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;

  return leadId;
}
