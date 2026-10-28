import StatusPill from "@/components/StatusPill";
import { pageUser } from "@/lib/auth";
import { listAllBookings } from "@/lib/repo";
import { formatDay, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminBookings() {
  await pageUser("ADMIN");
  const bookings = await listAllBookings();

  return (
    <div className="wrap">
      <h1 style={{ fontSize: "1.9rem" }}>All bookings</h1>
      <p className="muted mt8">Commission is locked in when a job completes, so these figures are final.</p>

      <div className="tablewrap mt24">
        <table>
          <thead>
            <tr>
              <th>Ref</th><th>Customer</th><th>Service</th><th>Slot</th><th>Professional</th>
              <th>Job value</th><th>Commission</th><th>Fee</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.ref}</strong></td>
                <td>{b.customer_name}<div className="xs muted">{b.customer_phone}</div></td>
                <td>
                  {b.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                  <div className="xs muted">{b.zone}</div>
                </td>
                <td>{formatDay(b.day)}<div className="xs muted">{b.slot}</div></td>
                <td>{b.partner_name || <span className="muted">—</span>}</td>
                <td>{money(b.items_total)}</td>
                <td>{b.status === "COMPLETED" ? money(b.commission) : <span className="muted">—</span>}</td>
                <td>{money(b.fee)}</td>
                <td><StatusPill status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
