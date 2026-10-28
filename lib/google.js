/**
 * Google sign-in, OAuth 2.0 authorization-code flow.
 * No SDK: two fetches and a signature check against Google's public keys.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let jwks;
const keys = () => (jwks ||= createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")));

export const googleEnabled = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Must match a redirect URI registered in the Google Cloud console, exactly. */
export function redirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const base =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    req.nextUrl.origin;
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
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
