import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setPartnerStatus } from "@/lib/repo";
import { sameOrigin } from "@/lib/safe";

export async function POST(req, { params }) {
  const { id } = await params;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Staff access only." }, { status: 403 });

  const { status } = await req.json();
  if (!["APPROVED", "SUSPENDED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }
  await setPartnerStatus(id, status);
  return NextResponse.json({ ok: true });
}
