import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn what information Vanify collects, how it is used, and when it is shared.",
};

const sections = [
  {
    title: "Who this policy covers",
    paragraphs: [
      "This policy explains how Vanify Express Pvt. Ltd. handles personal information when you use the Vanify website and booking platform in Hyderabad, whether you are a customer or a professional. It should be read with our Terms and Conditions.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: ["Depending on how you use Vanify, information may include:"],
    bullets: [
      "Account details: name, mobile number, optional email address, and sign-in information. Passwords are stored as a hash, not as plain text.",
      "If you choose Google sign-in when it is enabled: information Google provides for sign-in, such as your name, email address and profile image.",
      "Booking details: selected services, prices, area, appointment slot, service address, notes, booking status, start-code status, and messages or reports you submit about a booking.",
      "Professional profile details: trades, service areas and onboarding information. The onboarding team may check identity and address details, including Aadhaar, as part of professional verification.",
      "Basic technical and security information needed to operate, protect and troubleshoot the site.",
    ],
  },
  {
    title: "How we use information",
    bullets: [
      "Create and secure accounts, sign you in, and provide customer or professional features.",
      "Arrange bookings, connect customers with an accepting professional, send service updates, and handle support requests or complaints.",
      "Verify professional profiles, maintain booking and payment records, prevent misuse, and protect the safety and reliability of the platform.",
      "Meet legal obligations and resolve disputes.",
    ],
  },
  {
    title: "When information is shared",
    paragraphs: [
      "We do not sell personal information. We share only what is needed to provide and protect the service:",
    ],
    bullets: [
      "A professional assigned to your booking receives the details needed to do the job. Before acceptance, nearby professionals see limited request information; the full address and customer phone number are shared with the accepting professional as needed for the booking.",
      "Customers can see the assigned professional's relevant profile and contact details for the accepted job.",
      "Service providers that host or operate parts of the site may process information on our behalf, subject to appropriate safeguards.",
      "If Google sign-in is enabled and you choose to use it, Google processes information under Google's own privacy terms.",
      "We may disclose information when required by law or when reasonably necessary to protect people, the platform, or legal rights.",
    ],
  },
  {
    title: "Professional verification",
    paragraphs: [
      "The professional registration page explains that our onboarding team may contact applicants to verify Aadhaar and address details. The registration form does not ask you to upload an Aadhaar image. Do not send identity documents through an unverified link or channel; contact Vanify if you are unsure how to complete a requested check.",
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      "Customers arrange cash or UPI payment after the service. Vanify does not collect card or UPI credentials through the website. We may keep booking and payment-status records needed to support the transaction and resolve questions about it.",
    ],
  },
  {
    title: "Storage, security and retention",
    paragraphs: [
      "We use reasonable administrative and technical safeguards designed to protect personal information. No online service can guarantee absolute security, so keep your password private and tell us promptly if you suspect account misuse.",
      "We keep information for as long as needed to provide the service, manage accounts and bookings, address disputes, maintain appropriate records, and meet legal obligations. Retention periods depend on the type of information and why it was collected.",
    ],
  },
  {
    title: "Cookies and local storage",
    paragraphs: [
      "Vanify uses an essential session cookie to keep you signed in. The site also uses your browser's local storage to remember the items in your cart. You can clear these in your browser, but signing out or clearing them may affect site features.",
    ],
  },
  {
    title: "Your choices and requests",
    paragraphs: [
      "You can update account details through the relevant account features where available. To ask a question, request access or correction, or ask us to delete information, email shashikanthnagaram@gmail.com. We may need to verify your identity and may retain information where required or permitted by law.",
      "You can choose not to provide optional information, such as an email address, but some information is necessary to create an account or complete a booking.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "Vanify is intended for adults arranging services, not for children. We do not knowingly seek personal information directly from children. If you believe a child has provided information to us, please contact us so we can review it.",
    ],
  },
  {
    title: "Updates and contact",
    paragraphs: [
      "We may update this policy as the service or applicable requirements change. The latest version and update date will appear on this page. For privacy questions or requests, email shashikanthnagaram@gmail.com or visit the Help page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="A clear explanation of the information Vanify uses to arrange and support your bookings."
      sections={sections}
      relatedPolicies={[
        { href: "/terms", label: "Terms and Conditions" },
        { href: "/cancellation-refunds", label: "Cancellation & Refund Policy" },
      ]}
    />
  );
}
