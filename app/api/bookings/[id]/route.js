import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/safe";
import { createIssue, getBooking, rateBooking, setBookingStatus } from "@/lib/repo";

export async function POST(req, { params }) {
  const { id } = await params;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const booking = await getBooking(id);
  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { action, rating, review, text } = await req.json();

  switch (action) {
    case "cancel":
      if (!["SEARCHING", "ACCEPTED"].includes(booking.status)) {
        return NextResponse.json({ error: "This job has already started. Call support to cancel." }, { status: 400 });
      }
      await setBookingStatus(booking.id, "CANCELLED", "Cancelled by customer");
      return NextResponse.json({ ok: true });

    case "rate": {
      const n = Number(rating);
      if (booking.status !== "COMPLETED") return NextResponse.json({ error: "You can rate a job once it is finished." }, { status: 400 });
      if (!(n >= 1 && n <= 5)) return NextResponse.json({ error: "Pick a rating between 1 and 5." }, { status: 400 });
      await rateBooking(booking.id, n, review);
      return NextResponse.json({ ok: true });
    }

    case "issue":
      if (!text || text.trim().length < 5) {
        return NextResponse.json({ error: "Tell us what happened so support can act on it." }, { status: 400 });
      }
      await createIssue(booking.id, text.trim());
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
