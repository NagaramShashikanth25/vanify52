import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { resolveIssue } from "@/lib/repo";
import { sameOrigin } from "@/lib/safe";

export async function POST(req, { params }) {
  const { id } = await params;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Staff access only." }, { status: 403 });
  await resolveIssue(id);
  return NextResponse.json({ ok: true });
}
