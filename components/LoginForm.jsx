"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    router.push(safeNext(params.get("next"), data.next));
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="phone">Mobile number</label>
        <input id="phone" name="phone" inputMode="numeric" autoComplete="tel" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
      </div>
      {error && <div className="notice error" style={{ marginBottom: 14 }}>{error}</div>}
      <button className="btn full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
