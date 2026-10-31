"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserIcon } from "./Icons";
import LogoutButton from "./LogoutButton";

export default function AccountMenu({ name, email, role }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (event.type === "keydown" && event.key === "Escape") setOpen(false);
      if (event.type === "pointerdown" && !menuRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="account-menu-trigger"
        type="button"
        aria-label="Open account menu"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <UserIcon />
        <span>Account</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      {open && (
        <nav className="account-menu-panel" aria-label="Account menu">
          <div className="account-menu-heading">
            <strong>{name}</strong>
            {email && <span>{email}</span>}
          </div>
          <Link href="/account/profile" onClick={() => setOpen(false)}>Profile &amp; settings</Link>
          {role === "CUSTOMER" && (
            <Link href="/account/bookings" onClick={() => setOpen(false)}>My bookings</Link>
          )}
          {role === "PARTNER" && (
            <Link href="/partner/profile" onClick={() => setOpen(false)}>Trades &amp; service areas</Link>
          )}
          <div className="account-menu-divider" />
          <LogoutButton label="Sign out" />
        </nav>
      )}
    </div>
  );
}
