import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { listCategories, listServices } from "@/lib/repo";

export async function GET() {
  return NextResponse.json({ services: await listServices(), categories: await listCategories() });
}
