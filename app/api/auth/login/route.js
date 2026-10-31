import { NextResponse } from "next/server";
import { findUserByEmail, findUserByPhone, getPartnerByUser } from "@/lib/repo";
import { checkPassword, signSession, setSessionCookie } from "@/lib/auth";
import { clearThrottle, clientIp, throttle } from "@/lib/guard";
import { sameOrigin } from "@/lib/safe";

// bcrypt hash of a random string nobody knows. Never matches; only costs the same time.
const NO_ACCOUNT_HASH = "$2a$10$osxfrgV2KpOknwlBdy4cxu4UJJ9tSx417K9evdTZjh2r/ieAj4IAG";

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const { identifier: rawIdentifier, phone: legacyPhone, password } = await req.json();
  const identifier = String(rawIdentifier ?? legacyPhone ?? "").trim().slice(0, 254);
  const isEmail = identifier.includes("@");
  // Email is case-insensitive; formatted phone numbers share a throttle bucket.
  const normalized = isEmail ? identifier.toLowerCase() : identifier.replace(/\D/g, "").slice(-10);
  const throttleKey = `login:${isEmail ? "email" : "phone"}:${normalized}`;

  // Two limits: one per number (stops guessing one account's password) and a
  // looser one per address (stops spraying many accounts from one machine).
  const byIdentifier = throttle(throttleKey, { limit: 5, window: 900 });
  const byIp = throttle(`login-ip:${clientIp(req)}`, { limit: 20, window: 900 });
  if (!byIdentifier.ok || !byIp.ok) {
    const wait = Math.ceil(((byIdentifier.retryIn || byIp.retryIn) || 900) / 60);
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in about ${wait} minute${wait === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  const user = isEmail
    ? validEmail ? await findUserByEmail(normalized) : null
    : normalized.length === 10 ? await findUserByPhone(normalized) : null;

  // Same message AND the same work either way — never reveal which number exists.
  // An unknown identifier, or a Google-only account with no password, is checked
  // against a throwaway hash so the reply takes as long as a real check.
  const fail = () => NextResponse.json({ error: "That email or mobile number and password do not match." }, { status: 401 });
  const matches = await checkPassword(String(password || ""), user?.password_hash || NO_ACCOUNT_HASH);
  if (!user?.password_hash || !matches) return fail();

  clearThrottle(throttleKey);
  await setSessionCookie(await signSession(user));

  let next = "/account/bookings";
  if (user.role === "ADMIN") next = "/admin";
  if (user.role === "PARTNER") next = (await getPartnerByUser(user.id)) ? "/partner/dashboard" : "/partner/register";

  return NextResponse.json({ ok: true, role: user.role, next });
}
