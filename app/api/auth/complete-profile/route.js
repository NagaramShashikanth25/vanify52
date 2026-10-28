import { NextResponse } from "next/server";
import { currentUser, signSession, setSessionCookie } from "@/lib/auth";
import { findUserByPhone, setUserPhone } from "@/lib/repo";
import { sameOrigin } from "@/lib/safe";

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { phone } = await req.json();
  const digits = String(phone || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(digits)) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number.", field: "phone" }, { status: 400 });
  }

  const taken = await findUserByPhone(digits);
  if (taken && taken.id !== user.id) {
    return NextResponse.json({ error: "That number already belongs to another account.", field: "phone" }, { status: 400 });
  }

  await setUserPhone(user.id, digits);
  await setSessionCookie(await signSession({ ...user, phone: digits }));   // refresh the claims
  return NextResponse.json({ ok: true });
}
