import Link from "next/link";
import { Logo } from "./Icons";
import AccountMenu from "./AccountMenu";
import { getSession } from "@/lib/auth";

export default async function OpsHeader() {
  const session = await getSession();
  return (
    <header className="topbar ops">
      <div className="wrap bar">
        <Link href="/admin" className="brand"><Logo />Vanify <span className="tag">Ops</span></Link>
        <nav className="mainnav">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/partners">Professionals</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <AccountMenu name={session?.name || "Admin"} role="ADMIN" />
        </nav>
      </div>
    </header>
  );
}
