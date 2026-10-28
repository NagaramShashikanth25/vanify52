import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authUrl, googleEnabled, redirectUri } from "@/lib/google";
import { publicOrigin, safeNext } from "@/lib/safe";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", publicOrigin(req)));
  }

  // Random state, stored in a short-lived cookie, checked on the way back (CSRF).
  const state = crypto.randomUUID();
  const next = safeNext(req.nextUrl.searchParams.get("next"), "");

  (await cookies()).set("vn_oauth", JSON.stringify({ state, next }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 600,
  });

  return NextResponse.redirect(authUrl({ redirect: redirectUri(req), state }));
}
