import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { throttle, clearThrottle } from "@/lib/guard";
import { sameOrigin } from "@/lib/safe";
import {
  acceptBooking, activePartnerJob, completeBooking, getBooking,
  releaseBooking, setBookingStatus,
} from "@/lib/repo";

export async function POST(req, { params }) {
  const { id } = await params;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const user = await requireRole("PARTNER");
  if (!user?.partner) return NextResponse.json({ error: "Not signed in as a professional." }, { status: 403 });
  if (user.partner.status !== "APPROVED") return NextResponse.json({ error: "Your profile is still being verified." }, { status: 403 });

  const { action, otp } = await req.json();
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "That job no longer exists." }, { status: 404 });

  if (action === "accept") {
    if (await activePartnerJob(user.partner.id)) {
      return NextResponse.json({ error: "Finish your current job before accepting another." }, { status: 409 });
    }
    const got = await acceptBooking(booking.id, user.partner.id, user.name);
    if (!got) return NextResponse.json({ error: "Another professional took that job." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  // Everything below is only for the partner who owns the job.
  if (booking.partner_id !== user.partner.id) {
    return NextResponse.json({ error: "That job is not assigned to you." }, { status: 403 });
  }

  switch (action) {
    case "on_way":
      await setBookingStatus(booking.id, "ON_WAY", "Professional is on the way");
      return NextResponse.json({ ok: true });

    case "start": {
      // A four-digit code is 10,000 guesses, so cap the attempts per job.
      const key = `otp:${booking.id}:${user.partner.id}`;
      const gate = throttle(key, { limit: 5, window: 1800 });
      if (!gate.ok) {
        return NextResponse.json(
          { error: "Too many wrong codes. Call support on +91 90000 00001 to start this job." },
          { status: 429 }
        );
      }
      if (String(otp || "").trim() !== booking.otp) {
        return NextResponse.json({ error: "That start code does not match this booking." }, { status: 400 });
      }
      clearThrottle(key);
      await setBookingStatus(booking.id, "STARTED", "Work started");
      return NextResponse.json({ ok: true });
    }

    case "complete": {
      if (booking.status !== "STARTED") {
        return NextResponse.json({ error: "Enter the customer's start code first." }, { status: 400 });
      }
      const { net } = await completeBooking(booking.id);
      return NextResponse.json({ ok: true, net });
    }

    case "release":
      await releaseBooking(booking.id);
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
