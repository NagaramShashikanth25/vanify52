import { NextResponse } from "next/server";
import { createUser, findUserByPhone } from "@/lib/repo";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { sameOrigin } from "@/lib/safe";

const bad = (msg, field) => NextResponse.json({ error: msg, field }, { status: 400 });

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const { name, phone, email, password } = await req.json();

  if (!name || name.trim().length < 2) return bad("Enter your full name.", "name");
  if (!/^\d{10}$/.test(String(phone || ""))) return bad("Enter a valid 10-digit mobile number.", "phone");
  if (!password || password.length < 8) return bad("Use at least 8 characters for your password.", "password");
  if (await findUserByPhone(phone)) return bad("That number is already registered. Sign in instead.", "phone");

  const user = await createUser({
    name: name.trim(), phone, email: email?.trim() || null,
    passwordHash: await hashPassword(password), role: "CUSTOMER",
  });

  await setSessionCookie(await signSession(user));
  return NextResponse.json({ ok: true, role: user.role });
}
