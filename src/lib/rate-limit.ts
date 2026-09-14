/**
 * Simple in-memory sliding-window rate limiter, keyed by caller-supplied
 * string (typically `ip:route`). Good enough to blunt basic scripted abuse
 * of public forms on a single warm serverless instance — it is NOT
 * distributed, so a cold start or a request landing on a different instance
 * resets its view of that key. If abuse becomes a real problem, replace this
 * with a shared store (Upstash Redis / Vercel KV) behind the same interface.
 */

const hits = new Map<string, number[]>();

const MAX_TRACKED_KEYS = 5000;

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  if (hits.size > MAX_TRACKED_KEYS) {
    for (const [k, ts] of hits) {
      if (ts.every((t) => t <= windowStart)) hits.delete(k);
    }
  }

  return false;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
