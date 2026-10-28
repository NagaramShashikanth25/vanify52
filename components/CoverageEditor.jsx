"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CoverageEditor({ categories, zones, initialSkills, initialZones }) {
  const router = useRouter();
  const [skills, setSkills] = useState(initialSkills);
  const [areas, setAreas] = useState(initialZones);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const dirty =
    JSON.stringify([...skills].sort()) !== JSON.stringify([...initialSkills].sort()) ||
    JSON.stringify([...areas].sort()) !== JSON.stringify([...initialZones].sort());

  async function save() {
    setBusy(true); setError(null); setMsg(null);
    const res = await fetch("/api/partner/coverage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills, zones: areas }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return; }
    setMsg("Saved. New requests will match these straight away.");
    router.refresh();
  }

  return (
    <div className="card mt16">
      <h4>Trades you take</h4>
      <div className="chipset mt16">
        {categories.map((c) => (
          <button key={c.id} className="chip" aria-pressed={skills.includes(c.id)}
            onClick={() => toggle(skills, setSkills, c.id)}>{c.name}</button>
        ))}
      </div>

      <h4 className="mt24">Areas you work in</h4>
      <div className="chipset mt16">
        {zones.map((z) => (
          <button key={z} className="chip" aria-pressed={areas.includes(z)}
            onClick={() => toggle(areas, setAreas, z)}>{z}</button>
        ))}
      </div>

      {error && <div className="notice error mt16">{error}</div>}
      {msg && <div className="notice green mt16">{msg}</div>}

      <button className="btn green mt24" disabled={!dirty || busy} onClick={save}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
