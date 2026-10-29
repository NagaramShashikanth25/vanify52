import Link from "next/link";
import { Logo } from "./Icons";
import LogoutButton from "./LogoutButton";
import { getSession } from "@/lib/auth";

export default async function PartnerHeader() {
  const session = await getSession();
  const isPartner = session?.role === "PARTNER" || session?.role === "ADMIN";

  return (
    <header className="topbar partner">
      <div className="wrap bar">
        <Link href={isPartner ? "/partner/dashboard" : "/partner"} className="brand">
          <Logo />Vanify <span className="tag">Partner</span>
        </Link>
        <nav className="mainnav">
          {isPartner ? (
            <>
              <Link href="/">Home</Link>
              <Link href="/partner/dashboard">Jobs</Link>
              <Link href="/partner/earnings">Earnings</Link>
              <Link href="/partner/profile">Profile</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/">Customer site</Link>
              <Link href="/partner/register">Register</Link>
              <Link className="btn s hivis" href="/login">Partner login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
