import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setPartnerCoverage, listCategories } from "@/lib/repo";
import { ZONES } from "@/lib/config";

export async function POST(req) {
  const user = await requireRole("PARTNER");
  if (!user?.partner) return NextResponse.json({ error: "Not signed in as a professional." }, { status: 403 });

  const { skills = [], zones = [] } = await req.json();
  const validCats = (await listCategories()).map((c) => c.id);
  const cleanSkills = skills.filter((s) => validCats.includes(s));
  const cleanZones = zones.filter((z) => ZONES.includes(z));
  if (!cleanSkills.length) return NextResponse.json({ error: "Keep at least one trade." }, { status: 400 });
  if (!cleanZones.length) return NextResponse.json({ error: "Keep at least one area." }, { status: 400 });

  await setPartnerCoverage(user.partner.id, { skills: cleanSkills, zones: cleanZones });
  return NextResponse.json({ ok: true });
}
