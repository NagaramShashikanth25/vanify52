import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listRecentCustomerBookings } from "@/lib/repo";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your bookings." }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Customer access only." }, { status: 403 });

  const bookings = await listRecentCustomerBookings(user.id);
  return NextResponse.json({
    bookings: bookings.map((booking) => ({
      id: booking.id,
      ref: booking.ref,
      status: booking.status,
      day: booking.day,
      slot: booking.slot,
      zone: booking.zone,
      items: booking.items.map(({ name, qty }) => ({ name, qty })),
    })),
  });
}
