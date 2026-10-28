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
