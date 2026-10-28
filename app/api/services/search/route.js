import { NextResponse } from "next/server";
import { searchServices } from "@/lib/repo";

export async function GET(req) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.trim().length < 2) return NextResponse.json({ services: [] });
  return NextResponse.json({ services: await searchServices(q.trim()) });
}
