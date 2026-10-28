import Link from "next/link";
import { Logo } from "./Icons";
import LogoutButton from "./LogoutButton";

export default function OpsHeader() {
  return (
    <header className="topbar ops">
      <div className="wrap bar">
        <Link href="/admin" className="brand"><Logo />Vanify <span className="tag">Ops</span></Link>
        <nav className="mainnav">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/partners">Professionals</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <LogoutButton label="Sign out" />
        </nav>
      </div>
    </header>
  );
}
