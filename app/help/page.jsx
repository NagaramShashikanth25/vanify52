import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Help & FAQs" };

const FAQS = [
  ["How soon can someone reach me?", "Most jobs booked for the same day are accepted within 10 minutes. If nobody accepts within 15 minutes we call you and either widen the search or help you move the slot."],
  ["What if the work is not done properly?", "Report the problem from your booking page. Support calls you within an hour, and we send another professional at no extra charge or refund you."],
  ["Do I have to arrange tools or materials?", "Professionals bring their own hand tools. Materials such as wires, pipes and paint are billed at actual cost, and you see the bill before anything is bought."],
  ["Why is there a start code?", "Work begins only when you share your four-digit code with the professional at your door. It confirms the right person arrived and protects you from false claims."],
  ["How do I pay?", "Cash or UPI, after the job is finished. Nothing is charged when you book."],
  ["Can I ask for the same person again?", "Yes. Anyone you have hired before can be requested again from your booking history."],
  ["Is my address shared with everyone?", "No. Professionals nearby see only the service, the area and the slot. Your full address and phone number are shared with one professional after they accept."],
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 48, minHeight: "70vh" }}>
        <div className="wrap narrow">
          <h1 style={{ fontSize: "2rem" }}>Help &amp; FAQs</h1>
          <div className="mt24">
            {FAQS.map(([q, a], i) => (
              <details className="faq" key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div className="card mt32">
            <h3>Still stuck?</h3>
            <p className="sm muted mt8">Support runs 7 AM to 11 PM, seven days a week.</p>
            <a className="btn mt16" href="tel:+919000000000">Call +91 90000 00000</a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
