import Link from "next/link";
import { CITY } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="sitefoot">
      <div className="wrap footgrid">
        <div style={{ maxWidth: 280 }}>
          <h4>Vanify</h4>
          <p style={{ marginBottom: 10 }}>Verified professionals for home services, booked in a minute.</p>
          <p className="xs">A Vanify Express Pvt. Ltd. service · {CITY}, Telangana</p>
        </div>
        <div>
          <h4>Book</h4>
          <Link href="/services">All services</Link>
          <Link href="/account/bookings">My bookings</Link>
          <Link href="/help">Help &amp; FAQs</Link>
        </div>
        <div>
          <h4>Work with us</h4>
          <Link href="/partner">Become a professional</Link>
          <Link href="/partner/register">Register</Link>
          <Link href="/login">Professional login</Link>
        </div>
        <div>
          <h4>Company</h4>
          <a href="mailto:hello@vanify.in">hello@vanify.in</a>
          <a href="tel:+919000000000">+91 90000 00000</a>
          <Link href="/admin">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
