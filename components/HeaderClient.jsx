"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Icons";
import CartLink from "./CartLink";
import AccountMenu from "./AccountMenu";

/** Header for client-rendered pages (cart, checkout). Reads the session over fetch. */
export default function HeaderClient() {
  const [me, setMe] = useState(undefined);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => setMe(null));
  }, []);

  return (
    <header className="topbar">
      <div className="wrap bar">
        <Link href="/" className="brand"><Logo />Vanify</Link>
        <nav className="mainnav">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/help">Help</Link>
          <CartLink />
          {me === undefined ? null : me ? (
            <AccountMenu name={me.name} role={me.role} />
          ) : (
            <Link className="btn s" href="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
