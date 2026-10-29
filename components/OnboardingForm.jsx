"use client";
import { useState } from "react";
import { safeNext } from "@/lib/safe";

export default function OnboardingForm({ next }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "We couldn't save your number. Please try again.");
        return;
      }

      // Reload so the next request uses the refreshed session cookie.
      window.location.replace(safeNext(next, "/account/bookings"));
    } catch (err) {
      setError(err.name === "AbortError"
        ? "Saving took too long. Check your connection and try again."
        : "We couldn't save your number. Check your connection and try again.");
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={`field ${error ? "bad" : ""}`}>
        <label htmlFor="phone">Mobile number</label>
        <input id="phone" inputMode="numeric" autoComplete="tel" autoFocus value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit number" />
      </div>
      {error && <div className="notice error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
      <button className="btn full" disabled={phone.length !== 10 || busy}>
        {busy ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}
