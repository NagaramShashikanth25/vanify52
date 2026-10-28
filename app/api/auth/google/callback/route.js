import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, redirectUri, resolveGoogleUser, verifyIdToken } from "@/lib/google";
import { signSession, setSessionCookie } from "@/lib/auth";
import { getPartnerByUser } from "@/lib/repo";
import { publicOrigin, safeNext } from "@/lib/safe";

export const dynamic = "force-dynamic";

const fail = (req, reason) =>
  NextResponse.redirect(new URL(`/login?error=${reason}`, publicOrigin(req)));

export async function GET(req) {
  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail(req, "google_cancelled");

  const code = params.get("code");
  const state = params.get("state");
  const jar = await cookies();
  const saved = jar.get("vn_oauth")?.value;
  jar.set("vn_oauth", "", { path: "/", maxAge: 0 });

  if (!code || !saved) return fail(req, "google_failed");
  let intent;
  try { intent = JSON.parse(saved); } catch { return fail(req, "google_failed"); }
  if (intent.state !== state) return fail(req, "google_state");

  let profile;
  try {
    const tokens = await exchangeCode(code, redirectUri(req));
    profile = await verifyIdToken(tokens.id_token);
  } catch {
    return fail(req, "google_failed");
  }

  // Never attaches Google to a password account by email — see resolveGoogleUser.
  const found = await resolveGoogleUser(profile);
  if (found.error) return fail(req, found.error);
  const user = found.user;

  await setSessionCookie(await signSession(user));

  // A Google account carries no phone number, and every job needs one.
  if (!user.phone) {
    const safe = safeNext(intent.next, "");
    const next = safe ? `?next=${encodeURIComponent(safe)}` : "";
    return NextResponse.redirect(new URL(`/onboarding${next}`, publicOrigin(req)));
  }

  let dest = safeNext(intent.next, "");
  if (!dest) {
    dest = "/account/bookings";
    if (user.role === "ADMIN") dest = "/admin";
    if (user.role === "PARTNER") dest = (await getPartnerByUser(user.id)) ? "/partner/dashboard" : "/partner/register";
  }
  return NextResponse.redirect(new URL(dest, publicOrigin(req)));
}
