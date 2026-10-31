import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { listCategories, listServices } from "@/lib/repo";

export async function GET() {
  const [services, categories, session] = await Promise.all([
    listServices(), listCategories(), getSession(),
  ]);
  const pricesVisible = Boolean(session);
  return NextResponse.json({
    services: services.map((service) => ({ ...service, price: pricesVisible ? service.price : null })),
    categories,
    pricesVisible,
  });
}
