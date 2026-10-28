import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createBooking, getServices, listCategories, saveAddress } from "@/lib/repo";
import { BOOKING_DAYS, SLOTS, ZONES } from "@/lib/config";
import { nextDays, slotStarted } from "@/lib/format";
import { sameOrigin } from "@/lib/safe";
import { clientIp, throttle } from "@/lib/guard";

const bad = (msg, field) => NextResponse.json({ error: msg, field }, { status: 400 });

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to place a booking." }, { status: 401 });

  const flood = throttle(`book:${clientIp(req)}`, { limit: 10, window: 600 });
  if (!flood.ok) {
    return NextResponse.json({ error: "That is a lot of bookings at once. Give it a few minutes." }, { status: 429 });
  }

  const { cart = {}, zone, address, note, day, slot } = await req.json();

  // Whole numbers only: 1.5 of a fan repair is one fan repair.
  const qtyOf = (id) => Math.min(Math.floor(Number(cart[id])) || 0, 20);
  const ids = Object.keys(cart).filter((id) => qtyOf(id) >= 1).slice(0, 30);
  if (!ids.length) return bad("Your cart is empty.", "cart");
  if (!ZONES.includes(zone)) return bad("Choose a service area.", "zone");
  if (!address || address.trim().length < 6) return bad("Add the flat and building so the professional can find you.", "address");
  if (!SLOTS.includes(slot)) return bad("Pick a time slot.", "slot");
  // A real date in the bookable window — never a word like "Today", which would
  // mean a different day by tomorrow.
  const days = nextDays(BOOKING_DAYS).map((d) => d.key);
  if (!days.includes(day)) return bad("Pick a day in the next week.", "day");
  if (day === days[0] && slotStarted(slot)) return bad("That slot has already started today. Pick a later one.", "slot");

  if (address.trim().length > 300) return bad("Keep the address under 300 characters.", "address");

  // Prices always come from the database — never from the browser. Only services
  // still on offer count; an old cart in the browser may hold one we switched off.
  const services = await getServices(ids);
  if (services.length !== ids.length) {
    return bad("Something in your cart is no longer offered. Remove it and try again.", "cart");
  }

  // One booking goes to one professional, matched on one trade. A cart with an
  // electrical job and a plumbing job would otherwise reach only electricians.
  const tradeIds = [...new Set(services.map((s) => s.category_id))];
  if (tradeIds.length > 1) {
    const names = (await listCategories()).filter((c) => tradeIds.includes(c.id)).map((c) => c.name);
    return bad(`${names.join(" and ")} are done by different professionals. Book one trade now and the other after.`, "cart");
  }

  const items = services.map((s) => ({ id: s.id, name: s.name, price: s.price, qty: qtyOf(s.id) }));
  const line = address.trim();
  const cleanNote = String(note || "").trim().slice(0, 500);

  await saveAddress(user.id, { zone, line });
  const booking = await createBooking({
    customerId: user.id, items, categoryId: tradeIds[0], zone,
    address: line, note: cleanNote, day, slot,
  });

  return NextResponse.json({ ok: true, id: booking.id, ref: booking.ref });
}
