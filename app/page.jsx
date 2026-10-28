import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ServiceSearch from "@/components/ServiceSearch";
import { CategoryIcon, Verified } from "@/components/Icons";
import { categoryMinPrices, listApprovedPartners, listCategories } from "@/lib/repo";
import { money, initials } from "@/lib/format";
import { CITY, ZONES } from "@/lib/config";

export const dynamic = "force-dynamic";

const STEPS = [
  ["Pick your service", "Choose from fixed-price jobs. What you see is the full labour charge."],
  ["Choose a slot", "Same day if a professional is free, or any slot in the next week."],
  ["A professional accepts", "You get their name, rating and number, and can track them in."],
  ["Pay after the work", "Share your start code, get the job done, then pay and rate."],
];

const SAFETY = [
  ["Aadhaar and address verified", "Every professional is checked in person before their profile goes live."],
  ["A start code only you have", "Work begins when you share your four-digit code, so nobody can claim a job they did not do."],
  ["Pay after the work", "Nothing is charged upfront. If the job is not done, you do not pay."],
  ["Support that answers", "7 AM to 11 PM in Telugu, Hindi and English. Damage claims settled in 72 hours."],
];

export default async function HomePage() {
  // Three independent reads, sent together.
  const [categories, approved, minPrice] = await Promise.all([
    listCategories(), listApprovedPartners(), categoryMinPrices(),
  ]);
  const partners = approved.slice(0, 5);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="hero">
          <div className="wrap hero-grid">
            <div>
              <h1>Home services, done by people we have checked.</h1>
              <p className="lede">
                Cleaning, electrical, plumbing, carpentry, moving and event help across {CITY}. Fixed
                prices, a verified professional at your door, and you pay only after the work is finished.
              </p>
              <ServiceSearch />
              <div className="statrow">
                <div><strong className="figure">4,280</strong><span>jobs completed</span></div>
                <div><strong className="figure">{partners.length * 160}</strong><span>verified professionals</span></div>
                <div><strong className="figure">41 min</strong><span>average arrival</span></div>
              </div>
            </div>

            <div className="board">
              <div className="board-head">
                <h3>Professionals on duty</h3>
                <span className="live"><span className="dot" />live</span>
              </div>
              {partners.map((p) => {
                const cat = categories.find((c) => c.id === p.skills.split(",")[0]);
                return (
                  <div className="prow" key={p.id}>
                    <span className="avatar" aria-hidden="true">{initials(p.name)}</span>
                    <span>
                      <span className="name">{p.name}<Verified /></span>
                      <span className="sm muted">
                        {cat?.name.split(" ")[0]} · ★ {p.rating.toFixed(1)} · {p.jobs_done} jobs
                      </span>
                    </span>
                    <span className="right">
                      <span className="price">{money(minPrice[p.skills.split(",")[0]] || 0)}</span>
                      <span className="sm muted"> onwards</span>
                      <br />
                      <span className="xs" style={{ color: p.online ? "var(--hivis-ink)" : "var(--muted)" }}>
                        {p.online ? "Available today" : "Back tomorrow"}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>What do you need done?</h2>
              <p>Prices are the full labour charge for the job. Materials, if any, are shown to you before they are bought.</p>
            </div>
            <div className="tiles">
              {categories.map((c) => (
                <Link className="tile" key={c.id} href={`/services/${c.id}`}>
                  <CategoryIcon name={c.icon} />
                  <h3>{c.name}</h3>
                  <span className="sm muted">{c.blurb}</span>
                  <span className="from">From <strong>{money(minPrice[c.id])}</strong></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head"><h2>How booking works</h2></div>
            <div className="steps">
              {STEPS.map(([title, body], i) => (
                <div className="step" key={title}>
                  <span className="n">Step {i + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap grid g2" style={{ gap: 48 }}>
            <div>
              <h2 style={{ marginBottom: 22 }}>Why it is safe to let us in</h2>
              <div className="grid" style={{ gap: 20 }}>
                {SAFETY.map(([title, body]) => (
                  <div key={title}>
                    <h3 style={{ fontSize: "1rem" }}>{title}</h3>
                    <p className="sm muted mt8">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 style={{ marginBottom: 14 }}>Where we work</h2>
              <p className="muted">Live across {CITY}, adding areas as we onboard professionals.</p>
              <div className="chipset mt16">
                {ZONES.map((z) => <span className="chip" key={z}>{z}</span>)}
                <span className="chip muted">Warangal — soon</span>
                <span className="chip muted">Vijayawada — soon</span>
              </div>
              <div className="card mt24">
                <h3>Are you a professional?</h3>
                <p className="sm muted mt8">
                  Register on Vanify Partner to get jobs near you and get paid the same day.
                </p>
                <Link className="btn green mt16" href="/partner">Become a professional</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
