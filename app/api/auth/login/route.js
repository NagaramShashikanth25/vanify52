import { NextResponse } from "next/server";
import { findUserByPhone, getPartnerByUser } from "@/lib/repo";
import { checkPassword, signSession, setSessionCookie } from "@/lib/auth";
import { clearThrottle, clientIp, throttle } from "@/lib/guard";
import { sameOrigin } from "@/lib/safe";

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const { phone, password } = await req.json();

  // Two limits: one per number (stops guessing one account's password) and a
  // looser one per address (stops spraying many accounts from one machine).
  const byPhone = throttle(`login:${String(phone).slice(0, 15)}`, { limit: 5, window: 900 });
  const byIp = throttle(`login-ip:${clientIp(req)}`, { limit: 20, window: 900 });
  if (!byPhone.ok || !byIp.ok) {
    const wait = Math.ceil(((byPhone.retryIn || byIp.retryIn) || 900) / 60);
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in about ${wait} minute${wait === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }
  const user = await findUserByPhone(String(phone || "").trim());

  // Same message either way — never reveal which number exists.
  const fail = () => NextResponse.json({ error: "That mobile number and password do not match." }, { status: 401 });
  if (!user) return fail();
  if (!(await checkPassword(String(password || ""), user.password_hash))) return fail();

  clearThrottle(`login:${String(phone).slice(0, 15)}`);
  await setSessionCookie(await signSession(user));

  let next = "/account/bookings";
  if (user.role === "ADMIN") next = "/admin";
  if (user.role === "PARTNER") next = (await getPartnerByUser(user.id)) ? "/partner/dashboard" : "/partner/register";

  return NextResponse.json({ ok: true, role: user.role, next });
}
