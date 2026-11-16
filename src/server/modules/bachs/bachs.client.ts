import { createHmac, timingSafeEqual } from "crypto";
import { requireEnv } from "@/lib/env";

// Bachs authenticates every call with the secret key as a Bearer token, so unlike Monnify there is
// no login step or token cache. BACHS_BASE_URL is https://sandbox-api.bachs.io while testing (key
// prefix sk_sandbox_) and https://api.bachs.io in production (sk_live_). Going live is only a key
// and URL swap. Docs: https://docs.bachs.io/api-reference/overview

export class BachsError extends Error {
  readonly status: number;
  // Bachs' machine-readable code, e.g. INSUFFICIENT_BALANCE. null when the body had none.
  readonly code: string | null;
  readonly body: unknown;

  constructor(message: string, status: number, code: string | null, body: unknown) {
    super(message);
    this.name = "BachsError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

// Error bodies seen from the sandbox look like { "detail": "Insufficient balance to refund",
// "error_code": "INSUFFICIENT_BALANCE" }. message / error.message are read too, in case other
// endpoints use them.
type BachsErrorBody = { detail?: unknown; error_code?: unknown; message?: unknown; error?: { message?: unknown } } | null;

const readError = (body: BachsErrorBody) => {
  const text = [body?.detail, body?.message, body?.error?.message].find((value) => typeof value === "string");
  return {
    message: typeof text === "string" ? text : null,
    code: typeof body?.error_code === "string" ? body.error_code : null,
  };
};

type BachsRequest = {
  method?: "GET" | "POST";
  body?: unknown;
  // Sent as the Idempotency-Key header on POSTs, so a retried request (a timeout, a double click)
  // returns the first result instead of creating a second checkout or refund.
  idempotencyKey?: string;
};

export const bachsRequest = async <T>(path: string, { method = "GET", body, idempotencyKey }: BachsRequest = {}): Promise<T> => {
  const [baseUrl, secretKey] = requireEnv("BACHS_BASE_URL", "BACHS_SECRET_KEY");

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // A non-JSON body (a proxy error page, say) is kept as text for the log.
    parsed = text;
  }

  if (!response.ok) {
    const { message, code } = readError(typeof parsed === "object" ? (parsed as BachsErrorBody) : null);
    throw new BachsError(message ?? `Bachs request failed with status ${response.status}`, response.status, code, parsed);
  }

  return parsed as T;
};

// Bachs signs every webhook delivery. X-Bachs-Signature-V2 is "t=<unix seconds>,v1=<hex>", with more
// than one v1 for the 24 hours after a secret rotation. Each v1 is the HMAC-SHA256 hex of
// "<t>.<raw body>" with the endpoint's signing secret. Deliveries older (or newer) than this are
// refused, so a captured request can't be replayed later.
// Docs: https://docs.bachs.io/guides/webhooks/overview
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export const verifyBachsWebhookSignature = (
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean => {
  if (!signatureHeader || !secret) return false;

  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.trim().split("=", 2);
    if (key === "t") timestamp = value ?? null;
    if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();

  return signatures.some((signature) => {
    if (!/^[0-9a-f]+$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    // timingSafeEqual throws on different lengths, so check that first.
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
};
