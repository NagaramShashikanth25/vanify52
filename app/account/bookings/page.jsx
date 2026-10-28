import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StatusPill from "@/components/StatusPill";
import { currentUser } from "@/lib/auth";
import { listCustomerBookings } from "@/lib/repo";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My bookings" };

export default async function BookingsPage() {
  const user = await currentUser();
  const bookings = await listCustomerBookings(user.id);

  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 44, minHeight: "66vh" }}>
        <div className="wrap narrow">
          <h1 style={{ fontSize: "2rem" }}>My bookings</h1>

          {!bookings.length && (
            <div className="card mt24 center" style={{ padding: 40 }}>
              <h3>No bookings yet</h3>
              <p className="muted mt8">Your jobs will appear here with live status.</p>
              <Link className="btn mt24" href="/services">Book a service</Link>
            </div>
          )}

          {bookings.map((b) => (
            <Link className="card hover mt16" key={b.id} href={`/account/bookings/${b.id}`} style={{ display: "block", color: "inherit" }}>
              <div className="row between">
                <strong>{b.items.map((i) => i.name).join(", ")}</strong>
                <StatusPill status={b.status} />
              </div>
              <p className="sm muted mt8">{b.ref} · {b.day}, {b.slot} · {b.zone}</p>
              <p className="sm mt8">
                <strong className="price">{money(b.items_total + b.fee)}</strong>{" "}
                {b.status === "COMPLETED" ? "paid" : b.status === "CANCELLED" ? "— cancelled" : "payable after the service"}
              </p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
