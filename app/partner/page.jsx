import Link from "next/link";
import PartnerHeader from "@/components/PartnerHeader";
import SiteFooter from "@/components/SiteFooter";
import { Check } from "@/components/Icons";
import { COMMISSION, FREE_JOBS } from "@/lib/config";
import GoogleButton from "@/components/GoogleButton";
import { googleEnabled } from "@/lib/google";

export const metadata = { title: "Become a professional" };

const PROMISES = [
  "Jobs matched to your trade and the areas you choose",
  "Payouts the same day — no weekly wait",
  `Vanify keeps ${COMMISSION * 100}% of the job value, and your first ${FREE_JOBS} jobs are free of it`,
  "Go offline any day you do not want work",
  "Customer details stay hidden until you accept a job",
];

export default function PartnerLanding() {
  return (
    <>
      <PartnerHeader />
      <main>
        <div className="band">
          <div className="wrap grid g2" style={{ gap: 52, alignItems: "start" }}>
            <div>
              <h1>Get jobs near you. Get paid the same day.</h1>
              <p className="lede mt16">
                Vanify sends you work close to where you already are. You choose what you accept, you
                keep your own hours, and your money reaches you by 10 PM.
              </p>
              <ul className="checklist">
                {PROMISES.map((p) => (
                  <li key={p}><Check /><span>{p}</span></li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <h3>Start taking jobs</h3>
              <p className="sm muted mt8">
                Registration takes two minutes. Our team verifies your Aadhaar and address in person
                before your profile goes live.
              </p>
              <Link className="btn green full mt16" href="/partner/register">Register as a professional</Link>
              <hr className="mt24" />
              <p className="sm muted mt16">Already registered?</p>
              <Link className="btn ghost full mt8" href="/login">Partner login</Link>
              {googleEnabled() && (
                <>
                  <div className="divider">or</div>
                  <GoogleButton next="/partner/register" label="Continue with Google" />
                </>
              )}
              <p className="xs muted mt24">
                Demo login: 9876500001 / password123 (Ramesh — electrical, Kukatpally and Miyapur).
              </p>
            </div>
          </div>
        </div>

        <section className="section flush" style={{ paddingTop: 60 }}>
          <div className="wrap">
            <div className="section-head"><h2>How you get paid</h2></div>
            <div className="grid g3">
              <div className="card">
                <h3>1. Accept a job</h3>
                <p className="sm muted mt8">You see the trade, the area, the slot and exactly what you will earn before you accept.</p>
              </div>
              <div className="card">
                <h3>2. Finish the work</h3>
                <p className="sm muted mt8">Enter the customer&apos;s four-digit start code when you arrive, then mark the job complete.</p>
              </div>
              <div className="card">
                <h3>3. Money by 10 PM</h3>
                <p className="sm muted mt8">Job value minus commission reaches your registered account the same evening.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
