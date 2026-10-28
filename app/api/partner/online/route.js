import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setPartnerOnline } from "@/lib/repo";
import { sameOrigin } from "@/lib/safe";

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });
  const user = await requireRole("PARTNER");
  if (!user?.partner) return NextResponse.json({ error: "Not signed in as a professional." }, { status: 403 });
  if (user.partner.status !== "APPROVED") return NextResponse.json({ error: "Your profile is still being verified." }, { status: 403 });

  const { online } = await req.json();
  await setPartnerOnline(user.partner.id, !!online);
  return NextResponse.json({ ok: true, online: !!online });
}
