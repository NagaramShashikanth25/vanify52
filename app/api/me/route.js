import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listAddresses } from "@/lib/repo";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: s.uid, name: s.name, role: s.role },
    addresses: await listAddresses(s.uid),
  });
}
