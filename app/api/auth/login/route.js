import { NextResponse } from "next/server";
import { findUserByPhone, getPartnerByUser } from "@/lib/repo";
import { checkPassword, signSession, setSessionCookie } from "@/lib/auth";
import { clearThrottle, clientIp, throttle } from "@/lib/guard";
import { sameOrigin } from "@/lib/safe";

// bcrypt hash of a random string nobody knows. Never matches; only costs the same time.
const NO_ACCOUNT_HASH = "$2a$10$osxfrgV2KpOknwlBdy4cxu4UJJ9tSx417K9evdTZjh2r/ieAj4IAG";

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const { phone: rawPhone, password } = await req.json();
  // "+91 98765 00001" and "9876500001" are the same number and share one counter.
  const phone = String(rawPhone || "").replace(/\D/g, "").slice(-10);

  // Two limits: one per number (stops guessing one account's password) and a
  // looser one per address (stops spraying many accounts from one machine).
  const byPhone = throttle(`login:${phone}`, { limit: 5, window: 900 });
  const byIp = throttle(`login-ip:${clientIp(req)}`, { limit: 20, window: 900 });
  if (!byPhone.ok || !byIp.ok) {
    const wait = Math.ceil(((byPhone.retryIn || byIp.retryIn) || 900) / 60);
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in about ${wait} minute${wait === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }
  const user = await findUserByPhone(phone);

  // Same message AND the same work either way — never reveal which number exists.
  // An unknown number, or a Google-only account with no password, is checked
  // against a throwaway hash so the reply takes as long as a real check.
  const fail = () => NextResponse.json({ error: "That mobile number and password do not match." }, { status: 401 });
  const matches = await checkPassword(String(password || ""), user?.password_hash || NO_ACCOUNT_HASH);
  if (!user?.password_hash || !matches) return fail();

  clearThrottle(`login:${phone}`);
  await setSessionCookie(await signSession(user));

  let next = "/account/bookings";
  if (user.role === "ADMIN") next = "/admin";
  if (user.role === "PARTNER") next = (await getPartnerByUser(user.id)) ? "/partner/dashboard" : "/partner/register";

  return NextResponse.json({ ok: true, role: user.role, next });
}
