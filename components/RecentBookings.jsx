"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusPill from "@/components/StatusPill";
import { formatDay } from "@/lib/format";

export default function RecentBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/account/bookings/recent")
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return { bookings: [] };
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load recent bookings.");
        return data;
      })
      .then((data) => {
        if (active) setBookings(data.bookings || []);
      })
      .catch(() => {
        if (active) {
          setBookings([]);
          setError("Recent bookings could not be loaded. Open My bookings to try again.");
        }
      });
    return () => { active = false; };
  }, []);

  if (bookings === null || (!bookings.length && !error)) return null;

  return (
    <section className="recent-bookings mt24" aria-labelledby="recent-bookings-title">
      <div className="row between recent-bookings-heading">
        <div>
          <p className="home-eyebrow">Your account</p>
          <h2 id="recent-bookings-title">Recent bookings</h2>
        </div>
        <Link className="linkbtn" href="/account/bookings">View all</Link>
      </div>
      {error ? <div className="notice error mt16" role="alert">{error}</div> : (
        <div className="recent-bookings-list mt16">
          {bookings.map((booking) => (
            <Link className="card hover recent-booking" key={booking.id} href={`/account/bookings/${booking.id}`}>
              <div className="row between recent-booking-top">
                <strong>{booking.items.map((item) => `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ""}`).join(", ")}</strong>
                <StatusPill status={booking.status} />
              </div>
              <span className="sm muted">{booking.ref} · {formatDay(booking.day)}, {booking.slot}</span>
              <span className="sm muted">{booking.zone}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
