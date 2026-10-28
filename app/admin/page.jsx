import Link from "next/link";
import { pageUser } from "@/lib/auth";
import StatusPill from "@/components/StatusPill";
import ResolveIssue from "@/components/ResolveIssue";
import { listIssues, opsStats } from "@/lib/repo";
import { money, timeAgo } from "@/lib/format";
import { COMMISSION } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await pageUser("ADMIN");
  const s = await opsStats();
  const issues = await listIssues();

  return (
    <div className="wrap">
      <h1 style={{ fontSize: "1.9rem" }}>Overview</h1>

      <div className="grid g4 mt24">
        <div className="stat"><strong className="figure">{s.bookings}</strong><span>Bookings all time</span></div>
        <div className="stat"><strong className="figure">{money(s.gmv)}</strong><span>Completed job value</span></div>
        <div className="stat"><strong className="figure">{money(s.revenue)}</strong><span>Revenue ({COMMISSION * 100}% + fees)</span></div>
        <div className="stat"><strong className="figure">{s.approved}</strong><span>Approved professionals</span></div>
      </div>

      <div className="card mt16 sm muted">
        Revenue splits into {money(s.commission)} commission and {money(s.fees)} platform fees.
      </div>

      {s.pending > 0 && (
        <div className="panel mt24" style={{ borderColor: "var(--hivis)" }}>
          <div className="row between">
            <h3>{s.pending} professional{s.pending === 1 ? "" : "s"} waiting for approval</h3>
            <Link className="btn s" href="/admin/partners">Review now</Link>
          </div>
        </div>
      )}

      <h3 className="mt40">Live jobs</h3>
      <div className="tablewrap mt16">
        <table>
          <thead>
            <tr><th>Ref</th><th>Service</th><th>Area</th><th>Customer</th><th>Professional</th><th>Value</th><th>Status</th></tr>
          </thead>
          <tbody>
            {s.live.length ? s.live.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.ref}</strong><div className="xs muted">{timeAgo(b.created_at)}</div></td>
                <td>{b.items.map((i) => i.name).join(", ")}</td>
                <td>{b.zone}</td>
                <td>{b.customer_name}</td>
                <td>{b.partner_name || <span className="muted">unassigned</span>}</td>
                <td>{money(b.items_total)}</td>
                <td><StatusPill status={b.status} /></td>
              </tr>
            )) : <tr><td colSpan={7} className="muted">Nothing live right now.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 className="mt40">Issues raised</h3>
      <div className="tablewrap mt16">
        <table>
          <thead><tr><th>Booking</th><th>Issue</th><th>Raised</th><th>Status</th><th /></tr></thead>
          <tbody>
            {issues.length ? issues.map((i) => (
              <tr key={i.id}>
                <td><strong>{i.ref}</strong></td>
                <td>{i.text}</td>
                <td className="muted">{timeAgo(i.created_at)}</td>
                <td>{i.status === "OPEN" ? <span className="pill red">Open</span> : <span className="pill green">Resolved</span>}</td>
                <td>{i.status === "OPEN" && <ResolveIssue id={i.id} />}</td>
              </tr>
            )) : <tr><td colSpan={5} className="muted">No issues raised.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
