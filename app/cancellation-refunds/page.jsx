import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Cancellation and Refund Policy",
  description: "How to cancel a Vanify booking and what to do if you have a payment or service concern.",
};

const sections = [
  {
    title: "Booking payments",
    paragraphs: [
      "Vanify does not collect payment when you place a booking request. The checkout displays the service price and platform fee, and payment is arranged with the professional after the service is completed, by cash or UPI.",
      "Because payment is not collected in advance through the website, cancelling an eligible booking normally does not create a payment to refund through Vanify. Do not share UPI PINs, passwords, or one-time passwords with anyone claiming to issue a refund.",
    ],
  },
  {
    title: "How to cancel",
    paragraphs: [
      "Sign in, open My bookings, select the booking, and use Cancel booking while its status is Finding a professional or Professional assigned. The cancellation takes effect when the booking page shows it as cancelled.",
      "The in-app cancellation option is not available after the professional is on the way or work has started. If you need help at that point, contact Vanify using the details on the Help page as soon as possible.",
    ],
  },
  {
    title: "Charges after cancellation",
    paragraphs: [
      "For a booking cancelled through the available in-app option before work starts, no payment is due through Vanify for the unperformed service. If you have separately paid a professional or approved a materials purchase, contact us with your booking reference and details so we can review what happened.",
      "A booking request is not confirmed until a professional accepts it. If no one accepts, check the booking page and contact support for help; do not make a payment for work that was not performed.",
    ],
  },
  {
    title: "Service concerns and refund requests",
    paragraphs: [
      "If a service was incomplete, materially different from what you agreed, or you have another payment concern, use Report a problem on the booking page or contact support. Include your booking reference, what happened, and any relevant payment details. Please do not send full card or UPI credentials.",
      "Vanify will review the information and explain the next steps. Since payment is arranged directly with the professional and not processed by Vanify, any refund may need to be arranged with the person who received the payment. A refund is not automatic, and eligibility depends on the circumstances and applicable law.",
    ],
  },
  {
    title: "Contact Vanify",
    paragraphs: [
      "For help with a cancellation, payment, or service issue, visit Help & FAQs, call +91 63028 14114, or email shashikanthnagaram@gmail.com. Include your booking reference so we can identify the request.",
      "This policy does not limit any rights you have under applicable consumer protection law. If this policy conflicts with a right that cannot legally be excluded, that right will continue to apply.",
    ],
  },
];

export default function CancellationRefundsPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      description="Understand when you can cancel a booking and what to do if you have a payment or service concern."
      sections={sections}
      relatedPolicies={[
        { href: "/terms", label: "Terms and Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
      ]}
    />
  );
}
