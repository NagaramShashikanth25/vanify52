import { NextResponse } from "next/server";
import { currentUser, setSessionCookie, signSession } from "@/lib/auth";
import { setUserName } from "@/lib/repo";
import { sameOrigin } from "@/lib/safe";

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Enter a name between 1 and 80 characters." }, { status: 400 });
  }

  await setUserName(user.id, name);
  await setSessionCookie(await signSession({ ...user, name }));
  return NextResponse.json({ ok: true, name });
}
