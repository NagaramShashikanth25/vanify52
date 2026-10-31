"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileEditor({ name, email, phone }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dirty = value.trim() !== name;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(data?.error || "Could not save your profile. Please try again.");
        return;
      }
      setValue(data.name);
      setMessage("Your name has been updated.");
      router.refresh();
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card profile-card" onSubmit={save}>
      <h2>Personal details</h2>
      <p className="sm muted mt8">Keep your account details up to date.</p>
      <div className="field mt16">
        <label htmlFor="profile-name">Full name</label>
        <input id="profile-name" name="name" autoComplete="name" maxLength={80}
          value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="profile-email">Email address</label>
        <input id="profile-email" value={email || "Not added"} readOnly aria-describedby="profile-contact-note" />
      </div>
      <div className="field">
        <label htmlFor="profile-phone">Mobile number</label>
        <input id="profile-phone" value={phone || "Not added"} readOnly aria-describedby="profile-contact-note" />
      </div>
      <p id="profile-contact-note" className="xs muted">
        Email and mobile changes are read-only until we can verify them securely.
      </p>
      {error && <div className="notice error mt16" role="alert">{error}</div>}
      {message && <div className="notice green mt16" role="status">{message}</div>}
      <button className="btn green mt16" type="submit" disabled={!dirty || busy}>
        {busy ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
