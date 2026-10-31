import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ServiceSearch from "@/components/ServiceSearch";
import { CategoryIcon } from "@/components/Icons";
import { categoryMinPrices, listApprovedPartners, listCategories } from "@/lib/repo";
import { money } from "@/lib/format";
import { CITY, ZONES } from "@/lib/config";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STEPS = [
  ["Choose a service", "Browse service descriptions. Sign in to view prices and the total before you confirm."],
  ["Send a request", "Choose an area and time. A request is confirmed only after a professional accepts it."],
  ["Pay after the work", "Payment is arranged with the professional after the service, by cash or UPI."],
];

export default async function HomePage() {
  const [categories, approved, session] = await Promise.all([
    listCategories(), listApprovedPartners(), getSession(),
  ]);
  const pricesVisible = Boolean(session);
  const minPrice = pricesVisible ? await categoryMinPrices() : {};

  return (
    <>
      <SiteHeader />
      <main>
        <section className="home-hero">
          <div className="wrap">
            <p className="home-kicker"><span aria-hidden="true" /> Home services in {CITY}</p>
            <h1>Find the right help for your home.</h1>
            <p className="home-lede">
              {pricesVisible
                ? "Explore services, compare listed labour prices, and see the full amount before you send a booking request."
                : "Explore service options. Create a free account to see prices and the full amount before you send a booking request."}
            </p>
            <ServiceSearch />
            <p className="home-hero-note">
              {pricesVisible
                ? "No advance payment · Cash or UPI after the service · Materials are separate"
                : <>No advance payment · Materials are separate · <Link href="/register?next=%2F">Create a free account to see prices</Link></>}
            </p>
          </div>
        </section>

        <section className="wrap home-availability" aria-live="polite">
          <div className="availability-mark" aria-hidden="true">i</div>
          <div className="availability-copy">
            <h2>{approved.length === 0 ? "We’re just getting started" : "Approved professionals on Vanify"}</h2>
            <p>
              {approved.length === 0
                ? `Vanify is new, and we don’t have any approved professionals yet. Create an account to see service prices; booking requests may not be accepted until professionals are approved in ${CITY}.`
                : `${approved.length} professional${approved.length === 1 ? " is" : "s are"} approved on Vanify. Availability depends on the service, area, and time; a request is confirmed only when a professional accepts it.`}
            </p>
          </div>
          <Link className="btn ghost" href="/partner/register">Join as a professional</Link>
        </section>

        <section className="section home-services">
          <div className="wrap">
            <div className="section-head row between">
              <div>
                <p className="home-eyebrow">Explore the catalogue</p>
                <h2>What would you like help with?</h2>
                <p>
                  {pricesVisible
                    ? "Prices shown are labour charges. Materials, if needed, are discussed separately before purchase."
                    : "Browse service types. Sign in to see labour prices; materials, if needed, are discussed separately."}
                </p>
              </div>
              <Link className="linkbtn" href="/services">See all services →</Link>
            </div>
            <div className="tiles">
              {categories.map((category) => (
                <Link className="tile home-tile" key={category.id} href={`/services/${category.id}`}>
                  <CategoryIcon name={category.icon} />
                  <h3>{category.name}</h3>
                  <span className="sm muted">{category.blurb}</span>
                  <span className="from">
                    {pricesVisible
                      ? minPrice[category.id] ? <>From <strong>{money(minPrice[category.id])}</strong></> : "View services"
                      : "Sign in to view prices"}
                  </span>
                </Link>
              ))}
            </div>
            {!pricesVisible && (
              <p className="home-price-cta">
                <Link href="/register?next=%2F">Create a free account to view prices</Link>
              </p>
            )}
            <p className="xs muted mt12">The final total, including the platform fee, is shown before you place a request.</p>
          </div>
        </section>

        <section className="section home-how">
          <div className="wrap">
            <div className="section-head">
              <p className="home-eyebrow">Simple and clear</p>
              <h2>How booking works</h2>
            </div>
            <div className="steps">
              {STEPS.map(([title, description], index) => (
                <div className="step" key={title}>
                  <span className="n">Step {index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
            <div className="home-policy-note">
              Need to cancel or report a service issue? Read our <Link href="/cancellation-refunds">Cancellation &amp; Refund Policy</Link>.
            </div>
          </div>
        </section>

        <section className="section home-coverage">
          <div className="wrap grid g2" style={{ gap: 48, alignItems: "start" }}>
            <div>
              <p className="home-eyebrow">Service areas</p>
              <h2>Areas listed in {CITY}</h2>
              <p className="muted mt8">These areas can be selected when requesting a service. Professional availability varies by area and trade.</p>
              <div className="chipset mt16">
                {ZONES.map((zone) => <span className="chip" key={zone}>{zone}</span>)}
              </div>
            </div>
            <div className="home-partner-card">
              <p className="home-eyebrow">For local professionals</p>
              <h2>Build your profile on Vanify</h2>
              <p className="muted mt8">
                Tell us your trades and service areas. Profiles are reviewed before approval; registering does not guarantee approval or a specific number of jobs.
              </p>
              <Link className="btn green mt16" href="/partner/register">Register as a professional</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
