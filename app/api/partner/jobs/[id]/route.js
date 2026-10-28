import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { throttle, clearThrottle } from "@/lib/guard";
import { sameOrigin } from "@/lib/safe";
import {
  acceptBooking, activePartnerJob, advanceBooking, completeBooking, getBooking, releaseBooking,
} from "@/lib/repo";

const moved = () =>
  NextResponse.json({ error: "This job has changed since you opened it. Refresh to see where it stands." }, { status: 409 });

export async function POST(req, { params }) {
  const { id } = await params;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad request." }, { status: 403 });

  const user = await requireRole("PARTNER");
  if (!user?.partner) return NextResponse.json({ error: "Not signed in as a professional." }, { status: 403 });
  if (user.partner.status !== "APPROVED") return NextResponse.json({ error: "Your profile is still being verified." }, { status: 403 });

  const { action, otp } = await req.json();
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "That job no longer exists." }, { status: 404 });
  const partnerId = user.partner.id;

  if (action === "accept") {
    if (await activePartnerJob(partnerId)) {
      return NextResponse.json({ error: "Finish your current job before accepting another." }, { status: 409 });
    }
    const got = await acceptBooking(booking.id, user.partner, user.name);
    if (!got) return NextResponse.json({ error: "That job is no longer available to you." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  // Everything below is only for the partner who owns the job.
  if (booking.partner_id !== partnerId) {
    return NextResponse.json({ error: "That job is not assigned to you." }, { status: 403 });
  }

  switch (action) {
    case "on_way":
      if (!(await advanceBooking(booking.id, partnerId, ["ACCEPTED"], "ON_WAY", "Professional is on the way"))) return moved();
      return NextResponse.json({ ok: true });

    case "start": {
      if (!["ACCEPTED", "ON_WAY"].includes(booking.status)) return moved();
      // A four-digit code is 10,000 guesses, so cap the attempts per job.
      const key = `otp:${booking.id}:${partnerId}`;
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
      if (!(await advanceBooking(booking.id, partnerId, ["ACCEPTED", "ON_WAY"], "STARTED", "Work started"))) return moved();
      return NextResponse.json({ ok: true });
    }

    case "complete": {
      if (booking.status !== "STARTED") {
        return NextResponse.json({ error: "Enter the customer's start code first." }, { status: 400 });
      }
      const done = await completeBooking(booking.id, partnerId);
      if (!done) return moved();
      return NextResponse.json({ ok: true, net: done.net });
    }

    case "release":
      if (!(await releaseBooking(booking.id, partnerId))) return moved();
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
