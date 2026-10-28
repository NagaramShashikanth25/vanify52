import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { authSecret as secret } from "./lib/secret";

// Route guards (this file was called middleware.js before Next 16).
// Everything not listed here is public.
const RULES = [
  { prefix: "/account", roles: ["CUSTOMER", "PARTNER", "ADMIN"] },
  { prefix: "/partner/dashboard", roles: ["PARTNER", "ADMIN"] },
  { prefix: "/partner/earnings", roles: ["PARTNER", "ADMIN"] },
  { prefix: "/partner/profile", roles: ["PARTNER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/onboarding", roles: ["CUSTOMER", "PARTNER", "ADMIN"] },
];

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get("vn_session")?.value;
  let payload = null;
  if (token) {
    try {
      payload = (await jwtVerify(token, secret())).payload;
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // A Google account has no phone number until the user adds one.
  if (payload.hasPhone === false && !pathname.startsWith("/onboarding")) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(payload.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/partner/dashboard/:path*",
    "/partner/earnings/:path*",
    "/partner/profile/:path*",
    "/admin/:path*",
    "/onboarding",
  ],
};
