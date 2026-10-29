"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Icons";
import CartLink from "./CartLink";

/** Header for client-rendered pages (cart, checkout). Reads the session over fetch. */
export default function HeaderClient() {
  const [me, setMe] = useState(undefined);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => setMe(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

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
            <>
              <Link href="/account/bookings">My bookings</Link>
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <Link className="btn s" href="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
