import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StatusPill from "@/components/StatusPill";
import BookingActions from "@/components/BookingActions";
import { Verified } from "@/components/Icons";
import { pageUser } from "@/lib/auth";
import { getBooking } from "@/lib/repo";
import { formatDay, initials, money } from "@/lib/format";
import { STATUS_FLOW } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function BookingDetail({ params }) {
  const { id } = await params;
  const user = await pageUser();
  const booking = await getBooking(id);
  if (!booking || booking.customer_id !== user.id) notFound();

  const pro = booking.partner;
  const at = STATUS_FLOW.indexOf(booking.status);
  const stages = [
    ["Booking placed", "We sent it to professionals near you."],
    ["Professional assigned", pro ? `${pro.name} accepted your job.` : "Waiting for someone to accept."],
    ["On the way", pro ? `${pro.name} is heading to your address.` : ""],
    ["Work in progress", "Share your start code when they arrive."],
    ["Completed", "Pay the amount below and rate the work."],
  ];

  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 40 }}>
        <div className="wrap narrow">
          <Link className="linkbtn" href="/account/bookings">← My bookings</Link>

          <div className="row between mt16">
            <h1 style={{ fontSize: "1.8rem" }}>{booking.items.map((i) => i.name).join(", ")}</h1>
            <StatusPill status={booking.status} />
          </div>
          <p className="muted mt8">{booking.ref} · {formatDay(booking.day)}, {booking.slot}</p>

          {pro ? (
            <div className="card mt24">
              <div className="row" style={{ gap: 14 }}>
                <span className="avatar lg">{initials(pro.name)}</span>
                <div className="grow">
                  <strong className="name">{pro.name} <Verified /></strong>
                  <div className="sm muted">★ {pro.rating.toFixed(1)} · {pro.jobs_done} jobs completed</div>
                </div>
                <a className="btn ghost s" href={`tel:+91${pro.phone}`}>Call</a>
              </div>
            </div>
          ) : booking.status === "SEARCHING" ? (
            <div className="card mt24">
              <strong>Finding someone near {booking.zone}</strong>
              <p className="sm muted mt8">
                Most jobs are accepted within 10 minutes. We will call you if nobody is free.
              </p>
            </div>
          ) : null}

          {["ACCEPTED", "ON_WAY"].includes(booking.status) && (
            <div className="card mt16">
              <h4>Your start code</h4>
              <p className="sm muted mt8">
                Share this only after the professional arrives. Work cannot be started without it.
              </p>
              <div className="otp mt16">{booking.otp}</div>
            </div>
          )}

          <div className="card mt16">
            <h4>Status</h4>
            <ul className="timeline mt16">
              {stages.map(([title, body], i) => (
                <li key={title} className={booking.status === "CANCELLED" ? "" : i < at ? "done" : i === at ? "active" : ""}>
                  <strong>{title}</strong>
                  {body && <p>{body}</p>}
                </li>
              ))}
            </ul>
          </div>

          <div className="card mt16">
            <h4>Bill</h4>
            {booking.items.map((i) => (
              <div className="row between sm mt8" key={i.id}>
                <span>{i.name} × {i.qty}</span><span className="price">{money(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="row between sm mt8"><span>Platform fee</span><span className="price">{money(booking.fee)}</span></div>
            <hr className="mt16" />
            <div className="row between mt16">
              <strong>{booking.status === "COMPLETED" ? "Paid" : "Payable after the service"}</strong>
              <strong className="price">{money(booking.items_total + booking.fee)}</strong>
            </div>
            <p className="xs muted mt8">Address: {booking.address}, {booking.zone}</p>
          </div>

          <BookingActions
            id={booking.id}
            status={booking.status}
            rating={booking.rating}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
