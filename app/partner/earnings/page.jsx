import PartnerHeader from "@/components/PartnerHeader";
import SiteFooter from "@/components/SiteFooter";
import { pageUser } from "@/lib/auth";
import { partnerEarnings } from "@/lib/repo";
import { formatDay, money } from "@/lib/format";
import { COMMISSION, FREE_JOBS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const user = await pageUser("PARTNER", "ADMIN");
  const partner = user.partner;
  if (!partner) return null;
  const { rows, gross, commission, net } = await partnerEarnings(partner.id);

  return (
    <>
      <PartnerHeader />
      <main className="section flush" style={{ paddingTop: 44, minHeight: "70vh" }}>
        <div className="wrap">
          <h1 style={{ fontSize: "1.9rem" }}>Earnings</h1>

          <div className="grid g3 mt24">
            <div className="stat"><strong className="figure">{money(net)}</strong><span>Paid to you</span></div>
            <div className="stat"><strong className="figure">{money(gross)}</strong><span>Job value handled</span></div>
            <div className="stat"><strong className="figure">{money(commission)}</strong><span>Vanify fee ({COMMISSION * 100}%)</span></div>
          </div>

          <div className="tablewrap mt24">
            <table>
              <thead>
                <tr>
                  <th>Job</th><th>Day</th><th>Job value</th><th>Vanify fee</th><th>You received</th><th>Payout</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.ref}</strong>
                      <div className="xs muted">{b.items.map((i) => i.name).join(", ")}</div>
                    </td>
                    <td>{formatDay(b.day)}</td>
                    <td>{money(b.items_total)}</td>
                    <td>{b.commission ? `–${money(b.commission)}` : <span className="muted">free job</span>}</td>
                    <td><strong>{money(b.items_total - b.commission)}</strong></td>
                    <td><span className="pill green">Paid</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="muted">No completed jobs yet. Accept a request to start earning.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="xs muted mt16">
            Payouts reach your registered bank account by 10 PM on the day you finish the job.
            Your first {FREE_JOBS} jobs carry no Vanify fee.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
