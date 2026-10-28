import { NextResponse } from "next/server";
import { createUser, duplicateField, findUserByEmail, findUserByPhone } from "@/lib/repo";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { sameOrigin } from "@/lib/safe";

const bad = (msg, field) => NextResponse.json({ error: msg, field }, { status: 400 });
const TAKEN = {
  phone: ["That number is already registered. Sign in instead.", "phone"],
  email: ["That email is already used by another account. Sign in with your number, or leave email empty.", "email"],
};

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const { name, phone, email, password } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase() || null;

  if (!name || name.trim().length < 2) return bad("Enter your full name.", "name");
  if (name.trim().length > 80) return bad("Keep your name under 80 characters.", "name");
  if (!/^\d{10}$/.test(String(phone || ""))) return bad("Enter a valid 10-digit mobile number.", "phone");
  if (cleanEmail && (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))) {
    return bad("That email address does not look right.", "email");
  }
  if (!password || password.length < 8) return bad("Use at least 8 characters for your password.", "password");
  if (password.length > 72) return bad("Keep your password under 72 characters.", "password");
  if (await findUserByPhone(phone)) return bad(...TAKEN.phone);
  if (cleanEmail && (await findUserByEmail(cleanEmail))) return bad(...TAKEN.email);

  let user;
  try {
    user = await createUser({
      name: name.trim(), phone, email: cleanEmail,
      passwordHash: await hashPassword(password), role: "CUSTOMER",
    });
  } catch (err) {
    // Someone else took the same number or email in the same instant.
    const field = duplicateField(err);
    if (field && TAKEN[field]) return bad(...TAKEN[field]);
    throw err;
  }

  await setSessionCookie(await signSession(user));
  return NextResponse.json({ ok: true, role: user.role });
}
