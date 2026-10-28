"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [field, setField] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: k === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null); setField(null); setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setField(data.field); setBusy(false); return; }
    router.push("/account/bookings");
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={`field ${field === "name" ? "bad" : ""}`}>
        <label htmlFor="name">Your name</label>
        <input id="name" value={form.name} onChange={set("name")} autoComplete="name"
          placeholder="Name the professional should ask for" />
      </div>
      <div className={`field ${field === "phone" ? "bad" : ""}`}>
        <label htmlFor="phone">Mobile number</label>
        <input id="phone" value={form.phone} onChange={set("phone")} inputMode="numeric" autoComplete="tel"
          placeholder="10-digit number" />
      </div>
      <div className={`field ${field === "email" ? "bad" : ""}`}>
        <label htmlFor="email">Email (optional)</label>
        <input id="email" type="email" value={form.email} onChange={set("email")} autoComplete="email" />
      </div>
      <div className={`field ${field === "password" ? "bad" : ""}`}>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password} onChange={set("password")}
          autoComplete="new-password" placeholder="At least 8 characters" />
      </div>
      {error && <div className="notice error" style={{ marginBottom: 14 }}>{error}</div>}
      <button className="btn full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
    </form>
  );
}
