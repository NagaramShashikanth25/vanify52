/**
 * The one place the session-signing secret is read. lib/auth.js signs with it and
 * proxy.js verifies with it — they must always agree, or every sign-in "works"
 * and then bounces straight back to /login.
 */
const PLACEHOLDER = "change-this-to-a-long-random-string";

export function authSecret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32 && s !== PLACEHOLDER) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    // Falling back to a known string in production would let anyone forge an
    // admin session, so refuse to run instead.
    throw new Error(
      "AUTH_SECRET is missing or too short. Set it to 32+ random characters: " +
      'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
  return new TextEncoder().encode("development-only-secret-do-not-use-in-production");
}
