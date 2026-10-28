import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { findUserById, getPartnerByUser } from "./repo";

export const SESSION_COOKIE = "vn_session";
function secretValue() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32 && s !== "change-this-to-a-long-random-string") return s;
  if (process.env.NODE_ENV === "production") {
    // Falling back to a known string in production would let anyone forge an
    // admin session, so refuse to run instead.
    throw new Error(
      "AUTH_SECRET is missing or too short. Set it to 32+ random characters: " +
      'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
  return "development-only-secret-do-not-use-in-production";
}
const secret = () => new TextEncoder().encode(secretValue());

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
