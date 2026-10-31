import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Terms and Conditions",
  description: "Terms for using Vanify to find and book home-service professionals in Hyderabad.",
};

const sections = [
  {
    title: "About Vanify",
    paragraphs: [
      "Vanify is a service of Vanify Express Pvt. Ltd. We operate a platform that helps customers in Hyderabad find and book professionals for home and local services. These terms apply when you browse the site, create an account, book a service, or register as a professional.",
      "Vanify helps arrange bookings and provide support. The professional who accepts a booking carries out the on-site work. Nothing in these terms removes any responsibility or consumer right that cannot legally be excluded.",
    ],
  },
  {
    title: "Accounts and eligibility",
    paragraphs: [
      "You must be at least 18 and provide accurate information to create an account or place a booking. Keep your sign-in details private, use your own account, and tell us promptly if you believe someone else has accessed it.",
      "You are responsible for activity carried out through your account unless applicable law says otherwise. Do not impersonate another person or create accounts using contact details you do not control.",
    ],
  },
  {
    title: "Services, prices and materials",
    paragraphs: [
      "Service descriptions and prices are shown on the site and may change before you confirm a booking. The listed service price is the labour charge for the selected job. A platform fee of ₹19 is currently added per booking; the amount due is shown before you confirm.",
      "Materials are not included unless the listing says otherwise. If materials are needed, ask to see the cost before they are purchased. You are not required to approve additional materials or work that was not agreed.",
    ],
  },
  {
    title: "Booking and availability",
    paragraphs: [
      "Submitting a booking request does not by itself mean a professional has accepted it. A booking is confirmed when a professional accepts and the site shows the assigned professional. Availability, arrival times and service areas can change; we will use the contact details on your account to communicate booking updates.",
      "If a request cannot be filled, Vanify support may contact you to discuss another available slot or other next steps. Check the booking details and total shown before confirming.",
    ],
  },
  {
    title: "Payment",
    paragraphs: [
      "Payment is due after the service is completed, using cash or UPI as arranged for the booking. The site does not collect card or UPI credentials for these payments. Confirm the agreed service and any approved material costs with the professional before paying.",
    ],
  },
  {
    title: "Starting and completing a job",
    paragraphs: [
      "A booking may include a one-time start code. Share it with the assigned professional only when they have arrived and you are ready for the work to begin. Do not share it in advance or with someone who is not assigned to your booking.",
      "If there is a safety concern, the work differs from what you agreed, or the service is incomplete, pause the work where it is safe to do so and contact Vanify through the booking page or Help. Support will review the report and explain the available resolution; a re-visit or refund may be offered where appropriate.",
    ],
  },
  {
    title: "Changes, cancellations and support",
    paragraphs: [
      "If you need to change or cancel a booking, contact support as early as possible using the details on the Help page. We will confirm what options are available for that booking. For a service issue, report it from the booking page so we can identify the job and follow up.",
      "Do not treat a booking as changed or cancelled until you receive confirmation. Any amount due for work already completed or materials you approved will be handled in accordance with applicable law.",
    ],
  },
  {
    title: "Your responsibilities",
    bullets: [
      "Provide a correct address, a reachable phone number, and accurate information about the job.",
      "Make sure the professional can safely access the work area and tell them about relevant hazards or constraints.",
      "Treat professionals and support staff respectfully. Do not use the platform for unlawful, unsafe, fraudulent, or harassing activity.",
      "Do not interfere with the platform, attempt to access another person's account, or submit false booking or review information.",
    ],
  },
  {
    title: "Professional accounts",
    paragraphs: [
      "Professionals must provide accurate profile, trade and service-area information and complete the onboarding checks requested by Vanify. A profile may be reviewed, paused or removed if information is inaccurate, a safety concern arises, or these terms are seriously or repeatedly breached.",
      "Professionals are responsible for the quality and safe performance of work they accept, for communicating clearly with customers, and for complying with applicable laws and any terms presented during partner onboarding.",
    ],
  },
  {
    title: "Site availability and changes",
    paragraphs: [
      "We work to keep Vanify available, but we do not promise uninterrupted or error-free access. We may update, suspend or discontinue a feature, and may update these terms. The latest version and its update date will be posted here. Changes apply prospectively; a change will not take away rights you already have under applicable law.",
    ],
  },
  {
    title: "Law and contact",
    paragraphs: [
      "These terms are governed by the laws of India. Courts with jurisdiction in Hyderabad will hear disputes, subject to any mandatory consumer protections or other jurisdiction rules that apply to you.",
      "Questions about these terms or a booking? Contact Vanify at shashikanthnagaram@gmail.com or visit the Help page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description="Please read these terms before booking a service or using Vanify."
      sections={sections}
      otherPolicyHref="/privacy"
      otherPolicyLabel="Privacy Policy"
    />
  );
}
