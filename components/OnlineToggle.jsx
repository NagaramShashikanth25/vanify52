"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnlineToggle({ initial }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function flip() {
    const next = !on;
    setOn(next); setBusy(true);
    const res = await fetch("/api/partner/online", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ online: next }),
    });
    setBusy(false);
    if (!res.ok) { setOn(!next); return; }
    router.refresh();
  }

  return (
    <span className="row" style={{ gap: 10, fontWeight: 600, fontSize: ".93rem" }}>
      {on ? "You are online" : "You are offline"}
      <button className="switch" role="switch" aria-checked={on} aria-label="Take jobs" disabled={busy} onClick={flip} />
    </span>
  );
}
