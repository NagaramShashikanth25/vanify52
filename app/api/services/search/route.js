import { NextResponse } from "next/server";
import { searchServices } from "@/lib/repo";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const session = await getSession();
  const pricesVisible = Boolean(session);
  if (q.trim().length < 2) return NextResponse.json({ services: [], pricesVisible });
  const services = await searchServices(q.trim());
  return NextResponse.json({
    services: services.map((service) => ({ ...service, price: pricesVisible ? service.price : null })),
    pricesVisible,
  });
}
