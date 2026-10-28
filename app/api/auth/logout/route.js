import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { sameOrigin } from "@/lib/safe";

// Another site must not be able to sign people out either.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
