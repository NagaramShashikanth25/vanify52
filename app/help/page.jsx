import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Help & FAQs",
  description: "Get help with Vanify bookings, payments, privacy, and professional registration.",
};

const FAQ_GROUPS = [
  {
    id: "bookings",
    title: "Bookings",
    description: "Placing a request and keeping track of your service.",
    questions: [
      [
        "When is my booking confirmed?",
        "Your request is confirmed when a professional accepts it and their details appear on your booking. Until then, check the booking page for its latest status.",
      ],
      [
        "What if no professional has accepted yet?",
        "The booking page shows whether your request is still being matched. If you need help or the requested time is getting close, contact us with your booking reference.",
      ],
      [
        "Can I change or cancel a booking?",
        "Contact us as early as possible with your booking reference. We will confirm what options are available; your booking is not changed or cancelled until you receive confirmation.",
      ],
      [
        "Where can I see my booking details?",
        "Sign in and open My bookings, then select the booking to see its status, service, time, area, and assigned professional when available.",
      ],
    ],
  },
  {
    id: "service-and-payment",
    title: "Service & payment",
    description: "Understand the price, materials, and what happens at your home.",
    questions: [
      [
        "What does the listed price include?",
        "The listed price is the labour charge for the selected service. The platform fee is shown in your checkout total before you confirm. Materials are separate unless the service listing says otherwise.",
      ],
      [
        "How do I pay?",
        "Payment is due after the service, by cash or UPI as arranged with the professional. The amount due is shown before you place the booking; ask about any additional materials before they are purchased.",
      ],
      [
        "Why is there a start code?",
        "The code helps confirm that the right professional has arrived and that you are ready for work to begin. Share it only with the professional assigned to your booking, at your home, when you are ready.",
      ],
      [
        "What if there is a problem with the service?",
        "Contact us with your booking reference and a description of the issue. We will review the details and let you know the available next steps.",
      ],
    ],
  },
  {
    id: "privacy",
    title: "Privacy & account",
    description: "Learn how your booking information is handled.",
    questions: [
      [
        "Who can see my address and phone number?",
        "Nearby professionals see limited request details before accepting. Your full address and phone number are shared with the professional who accepts your booking so they can provide the service.",
      ],
      [
        "How can I ask about my personal information?",
        "Email us from the address below with your request. We may ask you to verify your identity before making changes or sharing account information.",
      ],
    ],
  },
  {
    id: "professionals",
    title: "For professionals",
    description: "Information about joining Vanify as a service professional.",
    questions: [
      [
        "How do I register as a professional?",
        "Start from Become a professional, choose the trades and areas you serve, and submit your profile. The onboarding team may contact you to verify your identity and address before your profile is approved.",
      ],
      [
        "When can I start receiving jobs?",
        "Your professional profile must be approved before you can receive jobs. You can check your account for its current status.",
      ],
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="help-page">
        <div className="wrap">
          <header className="help-heading">
            <p className="help-eyebrow">Vanify support</p>
            <h1>How can we help?</h1>
            <p>Find answers about booking a service, payment, your privacy, or joining as a professional.</p>
          </header>

          <nav className="help-topics" aria-label="Help topics">
            {FAQ_GROUPS.map((group) => (
              <a className="help-topic" href={`#${group.id}`} key={group.id}>{group.title}</a>
            ))}
          </nav>

          <div className="help-layout">
            <div className="help-faqs">
              {FAQ_GROUPS.map((group) => (
                <section className="help-group" id={group.id} key={group.id}>
                  <div className="help-group-heading">
                    <h2>{group.title}</h2>
                    <p>{group.description}</p>
                  </div>
                  {group.questions.map(([question, answer], index) => (
                    <details className="faq" key={question} open={group.id === "bookings" && index === 0}>
                      <summary>{question}</summary>
                      <p>{answer}</p>
                    </details>
                  ))}
                </section>
              ))}
            </div>

            <aside className="help-sidebar">
              <section className="help-card help-contact">
                <p className="help-eyebrow">We’re here to help</p>
                <h2>Still have a question?</h2>
                <p>Contact us about a booking, account, payment, or professional registration. For booking questions, include your booking reference.</p>
                <a className="btn green full mt16" href="tel:+916302814114">Call +91 63028 14114</a>
                <a className="btn ghost full mt8" href="mailto:shashikanthnagaram@gmail.com">Email Vanify support</a>
              </section>

              <section className="help-card">
                <p className="help-eyebrow">Good to know</p>
                <h2>Our policies</h2>
                <p>Read how Vanify works and how we handle your information.</p>
                <Link className="help-policy-link" href="/terms">
                  <span><strong>Terms and Conditions</strong><small>Bookings, payments, and using Vanify</small></span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link className="help-policy-link" href="/privacy">
                  <span><strong>Privacy Policy</strong><small>Information we collect and how it is used</small></span>
                  <span aria-hidden="true">→</span>
                </Link>
              </section>

              <section className="help-card help-next">
                <h2>Ready to book?</h2>
                <p>Browse available services and see the price before you confirm.</p>
                <Link className="btn full mt16" href="/services">Browse services</Link>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
