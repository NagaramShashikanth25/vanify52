import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { resolveIssue } from "@/lib/repo";

export async function POST(_req, { params }) {
  const { id } = await params;
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Staff access only." }, { status: 403 });
  await resolveIssue(id);
  return NextResponse.json({ ok: true });
}
