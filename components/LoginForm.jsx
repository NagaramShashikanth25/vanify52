"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe";

export default function LoginForm() {
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setBusy(false); return; }
      window.location.replace(safeNext(params.get("next"), data.next));
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="identifier">Email or mobile number</label>
        <input id="identifier" name="identifier" type="text" autoComplete="username" value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
          placeholder="you@example.com or 10-digit number" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="Your password" />
      </div>
      {error && <div className="notice error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
      <button className="btn green full auth-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
