import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { findUserById, getPartnerByUser } from "./repo";
import { authSecret as secret } from "./secret";

export const SESSION_COOKIE = "vn_session";

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export async function signSession(user) {
  return new SignJWT({ uid: user.id, role: user.role, name: user.name, hasPhone: Boolean(user.phone) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    return (await jwtVerify(token, secret())).payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Claims only — no database hit. */
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

/** Full user row, plus the partner profile when there is one. */
export async function currentUser() {
  const s = await getSession();
  if (!s) return null;
  const user = await findUserById(s.uid);
  if (!user) return null;
  if (user.role === "PARTNER") user.partner = await getPartnerByUser(user.id);
  return user;
}

export async function requireRole(...roles) {
  const user = await currentUser();
  if (!user) return null;
  if (roles.length && !roles.includes(user.role)) return null;
  return user;
}

/**
 * For server pages. proxy.js already guards these routes, but a page that reads
 * private data checks again itself — the same rule the API routes follow — so the
 * data stays safe even if the proxy is misconfigured or bypassed.
 */
export async function pageUser(...roles) {
  const user = await requireRole(...roles);
  if (user) return user;
  if (!(await getSession())) redirect("/login");
  redirect("/");
}
