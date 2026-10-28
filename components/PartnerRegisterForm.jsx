"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerRegisterForm({ categories, zones, signedInAs }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [skills, setSkills] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState(null);
  const [field, setField] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  async function submit(e) {
    e.preventDefault();
    setError(null); setField(null); setBusy(true);
    const res = await fetch("/api/partner/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, skills, zones: areas }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setField(data.field); setBusy(false); return; }
    router.push(data.next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate>
      {signedInAs ? (
        <div className="notice green" style={{ marginBottom: 18 }}>
          Adding a professional profile to your account ({signedInAs.name}, {signedInAs.phone}).
        </div>
      ) : (
        <>
          <div className={`field ${field === "name" ? "bad" : ""}`}>
            <label htmlFor="pname">Your name</label>
            <input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="As printed on your Aadhaar" autoComplete="name" />
          </div>
          <div className={`field ${field === "phone" ? "bad" : ""}`}>
            <label htmlFor="pphone">Mobile number</label>
            <input id="pphone" inputMode="numeric" autoComplete="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit number" />
            <p className="hint">Customers call this number once you accept their job.</p>
          </div>
          <div className={`field ${field === "password" ? "bad" : ""}`}>
            <label htmlFor="ppass">Password</label>
            <input id="ppass" type="password" autoComplete="new-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </div>
        </>
      )}

      <div className={`field ${field === "skills" ? "bad" : ""}`}>
        <label>Trades you work in</label>
        <div className="chipset">
          {categories.map((c) => (
            <button type="button" key={c.id} className="chip" aria-pressed={skills.includes(c.id)}
              onClick={() => toggle(skills, setSkills, c.id)}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className={`field ${field === "zones" ? "bad" : ""}`}>
        <label>Areas you can travel to</label>
        <div className="chipset">
          {zones.map((z) => (
            <button type="button" key={z} className="chip" aria-pressed={areas.includes(z)}
              onClick={() => toggle(areas, setAreas, z)}>{z}</button>
          ))}
        </div>
      </div>

      {error && <div className="notice error" style={{ marginBottom: 14 }}>{error}</div>}
      <button className="btn green full" disabled={busy}>{busy ? "Submitting…" : "Submit for verification"}</button>
    </form>
  );
}
