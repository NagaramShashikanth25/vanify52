import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createBooking, getServices, saveAddress } from "@/lib/repo";
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

  const ids = Object.keys(cart).filter((id) => cart[id] > 0);
  if (!ids.length) return bad("Your cart is empty.", "cart");
  if (!ZONES.includes(zone)) return bad("Choose a service area.", "zone");
  if (!address || address.trim().length < 6) return bad("Add the flat and building so the professional can find you.", "address");
  if (!SLOTS.includes(slot)) return bad("Pick a time slot.", "slot");
  // A real date in the bookable window — never a word like "Today", which would
  // mean a different day by tomorrow.
  const days = nextDays(BOOKING_DAYS).map((d) => d.key);
  if (!days.includes(day)) return bad("Pick a day in the next week.", "day");
  if (day === days[0] && slotStarted(slot)) return bad("That slot has already started today. Pick a later one.", "slot");

  // Prices always come from the database — never from the browser.
  const services = await getServices(ids);
  if (!services.length) return bad("Those services are no longer available.", "cart");

  const items = services.map((s) => ({ id: s.id, name: s.name, price: s.price, qty: Math.min(Number(cart[s.id]) || 1, 20) }));
  const categoryId = services[0].category_id;

  await saveAddress(user.id, { zone, line: address.trim() });
  const booking = await createBooking({
    customerId: user.id, items, categoryId, zone,
    address: address.trim(), note, day, slot,
  });

  return NextResponse.json({ ok: true, id: booking.id, ref: booking.ref });
}
