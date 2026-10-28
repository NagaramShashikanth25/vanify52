/**
 * Google sign-in, OAuth 2.0 authorization-code flow.
 * No SDK: two fetches and a signature check against Google's public keys.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createUser, duplicateField, findUserByEmail, findUserByGoogleId } from "./repo";
import { publicOrigin } from "./safe";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let jwks;
const keys = () => (jwks ||= createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")));

export const googleEnabled = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/**
 * Must match a redirect URI registered in the Google Cloud console, exactly.
 *
 * It is built from the address the visitor is actually on. VERCEL_URL is NOT
 * used: it is the per-deployment address (vanify-abc123-you.vercel.app), which
 * changes on every deploy, is never the one registered with Google, and is a
 * different site from the one holding the sign-in cookie.
 */
export function redirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return `${publicOrigin(req)}/api/auth/google/callback`;
}

/**
 * Finds or creates the account for a verified Google sign-in.
 *
 * A Google account is NOT attached to an existing password account just because
 * the emails match: the email typed at sign-up is never verified, so anyone could
 * register with someone else's address and then receive that person's Google
 * sign-in into an account they hold the password to. Instead the person is told
 * to sign in with their mobile number.
 *
 * Returns { user } or { error } where error is an AuthError code.
 */
export async function resolveGoogleUser(profile) {
  const existing = await findUserByGoogleId(profile.googleId);
  if (existing) return { user: existing };

  if (await findUserByEmail(profile.email)) return { error: "google_email_in_use" };

  try {
    const user = await createUser({
      name: profile.name, email: profile.email, googleId: profile.googleId,
      avatar: profile.avatar, role: "CUSTOMER",
    });
    return { user };
  } catch (err) {
    // A double click on the consent screen can race two callbacks.
    if (!duplicateField(err)) throw err;
    const again = await findUserByGoogleId(profile.googleId);
    return again ? { user: again } : { error: "google_email_in_use" };
  }
}

export function authUrl({ redirect, state }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params}`;
}

export async function exchangeCode(code, redirect) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Google rejected the sign-in code.");
  return res.json(); // { id_token, access_token, ... }
}

/** Verifies the ID token's signature, issuer, audience and expiry. */
export async function verifyIdToken(idToken) {
  const { payload } = await jwtVerify(idToken, keys(), {
    issuer: ISSUERS,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  if (!payload.email) throw new Error("Google did not return an email address.");
  if (payload.email_verified === false) throw new Error("That Google email is not verified.");
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    avatar: payload.picture || null,
  };
}
