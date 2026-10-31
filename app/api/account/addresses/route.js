import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createAddress } from "@/lib/repo";
import { ZONES } from "@/lib/config";
import { sameOrigin } from "@/lib/safe";

function addressInput(body) {
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const line = typeof body?.line === "string" ? body.line.trim() : "";
  const zone = typeof body?.zone === "string" ? body.zone : "";
  if (!label || label.length > 40) return { error: "Enter a label between 1 and 40 characters." };
  if (line.length < 6 || line.length > 300) return { error: "Enter an address between 6 and 300 characters." };
  if (!ZONES.includes(zone)) return { error: "Choose an available service area." };
  return { value: { label, line, zone } };
}

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") return NextResponse.json({ error: "Customer access only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const result = addressInput(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  const address = await createAddress(user.id, result.value);
  return NextResponse.json({ ok: true, address });
}
