import Link from "next/link";
import PartnerHeader from "@/components/PartnerHeader";
import SiteFooter from "@/components/SiteFooter";
import StatusPill from "@/components/StatusPill";
import OnlineToggle from "@/components/OnlineToggle";
import JobActions from "@/components/JobActions";
import { currentUser } from "@/lib/auth";
import { activePartnerJob, listCategories, openJobsFor, partnerEarnings } from "@/lib/repo";
import { formatDay, money, timeAgo } from "@/lib/format";
import { COMMISSION, FREE_JOBS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "My jobs" };

export default async function PartnerDashboard() {
  const user = await currentUser();
  const partner = user.partner;

  if (!partner) {
    return (
      <>
        <PartnerHeader />
        <main className="section flush" style={{ paddingTop: 60, minHeight: "60vh" }}>
          <div className="wrap narrow card center" style={{ padding: 40 }}>
            <h2>You do not have a professional profile yet</h2>
            <p className="muted mt8">Register your trade and areas to start receiving jobs.</p>
            <Link className="btn green mt24" href="/partner/register">Register as a professional</Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (partner.status !== "APPROVED") {
    return (
      <>
        <PartnerHeader />
        <main className="section flush" style={{ paddingTop: 60, minHeight: "60vh" }}>
          <div className="wrap narrow card center" style={{ padding: 40 }}>
            <span className={`pill ${partner.status === "PENDING" ? "amber" : "red"}`}>
              {partner.status === "PENDING" ? "Verification pending" : "Account suspended"}
            </span>
            <h2 className="mt16">
              {partner.status === "PENDING"
                ? `We are checking your details, ${user.name.split(" ")[0]}`
                : "Your account is on hold"}
            </h2>
            <p className="muted mt8">
              {partner.status === "PENDING"
                ? `Our onboarding team will call you on ${user.phone} within two working days to verify your Aadhaar and address.`
                : "Call the partner helpline on +91 90000 00001 and our team will walk you through what happens next."}
            </p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const categories = await listCategories();
  const skillNames = partner.skills.split(",").map((s) => categories.find((c) => c.id === s)?.name).filter(Boolean);
  const active = await activePartnerJob(partner.id);
  const open = partner.online ? await openJobsFor(partner) : [];
  const earnings = await partnerEarnings(partner.id);
  const commissionFree = partner.jobs_done < FREE_JOBS;

  return (
    <>
      <PartnerHeader />
      <main className="section flush" style={{ paddingTop: 44 }}>
        <div className="wrap">
          <div className="row between">
            <div>
              <h1 style={{ fontSize: "1.9rem" }}>Hello, {user.name.split(" ")[0]}</h1>
              <p className="sm muted mt8">
                {skillNames.join(", ")}
                {" · "}{partner.zones.split(",").join(", ")}
              </p>
            </div>
            <OnlineToggle initial={!!partner.online} />
          </div>

          <div className="grid g4 mt24">
            <div className="stat"><strong className="figure">{money(earnings.net)}</strong><span>Paid to you</span></div>
            <div className="stat"><strong className="figure">{partner.jobs_done}</strong><span>Jobs completed</span></div>
            <div className="stat"><strong className="figure">{partner.rating ? partner.rating.toFixed(1) : "—"}</strong><span>Your rating</span></div>
            <div className="stat"><strong className="figure">{open.length}</strong><span>Requests waiting</span></div>
          </div>

          {commissionFree && (
            <div className="notice mt24">
              Your first {FREE_JOBS} jobs are commission-free — {FREE_JOBS - partner.jobs_done} left.
            </div>
          )}

          {active && (
            <div className="panel mt24" style={{ borderColor: "var(--hivis)", borderWidth: 2 }}>
              <div className="row between">
                <h3>Current job · {active.ref}</h3>
                <StatusPill status={active.status} />
              </div>
              <p className="mt8"><strong>{active.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</strong></p>
              <p className="sm muted">{formatDay(active.day)}, {active.slot}</p>

              <div className="card mt16" style={{ background: "var(--paper)" }}>
                <p className="sm">
                  <strong>{active.customer?.name}</strong>
                  {active.customer?.phone && (
                    <> · <a href={`tel:+91${active.customer.phone}`}>{active.customer.phone}</a></>
                  )}
                </p>
                <p className="sm muted mt4">{active.address}, {active.zone}</p>
                {active.note && <p className="sm muted mt8">Note: {active.note}</p>}
              </div>

              <div className="row between mt16">
                <div>
                  <span className="sm muted">You earn</span>
                  <div className="price" style={{ fontSize: "1.25rem" }}>
                    {money(active.items_total - (commissionFree ? 0 : Math.round(active.items_total * COMMISSION)))}
                  </div>
                </div>
                <JobActions id={active.id} status={active.status} />
              </div>
            </div>
          )}

          <h3 className="mt40">New requests near you</h3>

          {!partner.online && (
            <div className="card mt16">
              <strong>You are offline</strong>
              <p className="sm muted mt8">Turn yourself online to start seeing jobs come in.</p>
            </div>
          )}

          {partner.online && !open.length && (
            <div className="card mt16">
              <strong>Nothing right now</strong>
              <p className="sm muted mt8">
                Requests for your trades in {partner.zones.split(",").join(" or ")} will appear here.
                Widen your areas in your profile to see more.
              </p>
            </div>
          )}

          {open.map((b) => {
            const commission = commissionFree ? 0 : Math.round(b.items_total * COMMISSION);
            return (
              <div className="card mt16" key={b.id}>
                <div className="row between">
                  <strong>{b.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</strong>
                  <span className="pill amber">{timeAgo(b.created_at)}</span>
                </div>
                <p className="sm muted mt8">{b.zone} · {formatDay(b.day)}, {b.slot}</p>
                <p className="xs muted mt8">
                  The full address and the customer&apos;s number are shared once you accept.
                </p>
                <div className="row between mt16">
                  <div>
                    <span className="sm muted">You earn</span>
                    <div className="price" style={{ fontSize: "1.15rem" }}>{money(b.items_total - commission)}</div>
                    <span className="xs muted">
                      Job value {money(b.items_total)}
                      {commission ? ` · Vanify fee ${money(commission)}` : " · no commission on this job"}
                    </span>
                  </div>
                  <JobActions id={b.id} status="OPEN" blocked={!!active} />
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
