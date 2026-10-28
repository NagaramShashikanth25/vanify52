"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { safeNext } from "@/lib/safe";

export default function OnboardingForm({ next }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    const res = await fetch("/api/auth/complete-profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    router.push(safeNext(next, "/account/bookings"));
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={`field ${error ? "bad" : ""}`}>
        <label htmlFor="phone">Mobile number</label>
        <input id="phone" inputMode="numeric" autoComplete="tel" autoFocus value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit number" />
      </div>
      {error && <div className="notice error" style={{ marginBottom: 14 }}>{error}</div>}
      <button className="btn full" disabled={phone.length !== 10 || busy}>
        {busy ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}
