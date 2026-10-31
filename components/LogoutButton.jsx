"use client";
import { useState } from "react";

export default function LogoutButton({ label = "Log out" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function out() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setError("Could not sign out. Please try again.");
        setBusy(false);
        return;
      }
      try { window.localStorage.removeItem("vanify_cart"); } catch {}
      window.location.replace("/");
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
      setBusy(false);
    }
  }
  return (
    <>
      {error && <span className="account-menu-error" role="alert">{error}</span>}
      <button className="account-menu-signout" type="button" disabled={busy} onClick={out}>
        {busy ? "Signing out…" : label}
      </button>
    </>
  );
}
