import { NextResponse } from "next/server";
import { createUser, createPartner, findUserByPhone, getPartnerByUser, listCategories, setUserRole } from "@/lib/repo";
import { hashPassword, signSession, setSessionCookie, currentUser } from "@/lib/auth";
import { ZONES } from "@/lib/config";
import { sameOrigin } from "@/lib/safe";

const bad = (msg, field) => NextResponse.json({ error: msg, field }, { status: 400 });

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const { name, phone, password, skills = [], zones = [] } = await req.json();

  const validCats = (await listCategories()).map((c) => c.id);
  const cleanSkills = skills.filter((s) => validCats.includes(s));
  const cleanZones = zones.filter((z) => ZONES.includes(z));
  if (!cleanSkills.length) return bad("Pick at least one trade you work in.", "skills");
  if (!cleanZones.length) return bad("Pick at least one area you can travel to.", "zones");

  // An existing signed-in user can upgrade to a partner account.
  const signedIn = await currentUser();
  if (signedIn) {
    if (signedIn.role === "ADMIN") return bad("Staff accounts cannot take jobs. Register with a separate number.", "phone");
    if (!signedIn.phone) return bad("Add your mobile number first — customers call it once you accept a job.", "phone");
    if (await getPartnerByUser(signedIn.id)) return bad("You already have a professional profile.", "phone");
    await createPartner(signedIn.id, { skills: cleanSkills, zones: cleanZones });
    // The role decides which pages open (proxy.js) and is carried in the session,
    // so update both — otherwise the new partner is bounced off the dashboard.
    await setUserRole(signedIn.id, "PARTNER");
    await setSessionCookie(await signSession({ ...signedIn, role: "PARTNER" }));
    return NextResponse.json({ ok: true, next: "/partner/dashboard" });
  }

  if (!name || name.trim().length < 2) return bad("Enter your full name as it appears on your Aadhaar.", "name");
  if (!/^\d{10}$/.test(String(phone || ""))) return bad("Enter a valid 10-digit mobile number.", "phone");
  if (!password || password.length < 8) return bad("Use at least 8 characters for your password.", "password");
  if (await findUserByPhone(phone)) return bad("That number is already registered. Sign in instead.", "phone");

  const user = await createUser({ name: name.trim(), phone, passwordHash: await hashPassword(password), role: "PARTNER" });
  await createPartner(user.id, { skills: cleanSkills, zones: cleanZones });
  await setSessionCookie(await signSession(user));
  return NextResponse.json({ ok: true, next: "/partner/dashboard" });
}
