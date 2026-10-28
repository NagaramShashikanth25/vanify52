/**
 * Small safety helpers used by anything that takes input from a URL,
 * a form or another site.
 */

/**
 * An open redirect lets an attacker send someone to
 * /login?next=https://evil-site.example and have OUR domain bounce them there,
 * which is how convincing phishing links get built. Only same-site paths pass.
 */
export function safeNext(value, fallback = "/") {
  const v = String(value || "");
  if (!v.startsWith("/")) return fallback;        // absolute URLs, javascript:, mailto:
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;  // protocol-relative
  if (v.includes("://")) return fallback;
  return v;
}

/**
 * The address the visitor is on, e.g. "https://vanify.vercel.app". Used to build
 * links that must come back to the same site (the Google callback).
 *   1. APP_URL, when set — the explicit, preferred choice in production.
 *   2. The Host (or x-forwarded-host) the request arrived on. On Vercel this is
 *      the domain the visitor typed. `next start` would otherwise report its own
 *      listen address (localhost:3000) instead.
 * Google only accepts callback addresses registered in its console, so a forged
 * Host header cannot send a sign-in anywhere unexpected.
 */
export function publicOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const first = (v) => String(v || "").split(",")[0].trim();
  const host = first(req.headers.get("x-forwarded-host")) || first(req.headers.get("host"));
  if (!host) return req.nextUrl.origin;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = first(req.headers.get("x-forwarded-proto")) || (local ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Cookies are SameSite=Lax, which already blocks most cross-site form posts.
 * Checking the Origin header as well closes the gap for clients that do send it
 * on same-site requests but could be tricked into a cross-site one.
 */
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;                        // same-origin fetches may omit it
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
