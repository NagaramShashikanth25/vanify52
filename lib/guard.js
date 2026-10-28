/**
 * In-memory throttling for the endpoints worth brute-forcing.
 *
 * This counts per server instance, which is enough to stop a script hammering
 * one box. On Vercel each instance has its own counters, so for serious
 * protection move these counts to Upstash Redis or Vercel KV — the call sites
 * do not change, only this file.
 */
const buckets = new Map();

function prune(now) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
}

/**
 * Returns { ok } or { ok: false, retryIn } in seconds.
 *   limit  attempts allowed inside the window
 *   window seconds the counter lives for
 */
export function throttle(key, { limit = 5, window = 900 } = {}) {
  const now = Date.now();
  prune(now);
  const entry = buckets.get(key);

  if (!entry || entry.until < now) {
    buckets.set(key, { count: 1, until: now + window * 1000 });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryIn: Math.ceil((entry.until - now) / 1000) };
  }
  return { ok: true, remaining: limit - entry.count };
}

/** Clears a bucket after a success, so a correct login resets the counter. */
export const clearThrottle = (key) => buckets.delete(key);

/** Best-effort client address behind Vercel's proxy. */
export const clientIp = (req) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";
