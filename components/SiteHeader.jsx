import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "./Icons";
import CartLink from "./CartLink";
import LogoutButton from "./LogoutButton";

export default async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="topbar">
      <div className="wrap bar">
        <Link href="/" className="brand"><Logo />Vanify</Link>
        <nav className="mainnav">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/help">Help</Link>
          {session?.role === "ADMIN" && <Link href="/admin">Ops</Link>}
          {session?.role === "PARTNER" && <Link href="/partner/dashboard">My jobs</Link>}
          {session ? (
            <>
              <Link href="/account/bookings">My bookings</Link>
              <CartLink />
              <LogoutButton />
            </>
          ) : (
            <>
              <CartLink />
              <Link className="btn s" href="/login">Sign in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
