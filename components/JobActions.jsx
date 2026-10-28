"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JobActions({ id, status, blocked }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(action, extra = {}) {
    setError(null); setBusy(true);
    const res = await fetch(`/api/partner/jobs/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return; }
    setOtpOpen(false); setOtp("");
    router.refresh();
  }

  return (
    <div style={{ textAlign: "right" }}>
      <div className="row end" style={{ gap: 8, flexWrap: "wrap" }}>
        {status === "OPEN" && (
          <button className="btn green s" disabled={busy || blocked} onClick={() => act("accept")}>
            Accept job
          </button>
        )}
        {status === "ACCEPTED" && (
          <button className="btn ghost s" disabled={busy} onClick={() => act("on_way")}>I am on the way</button>
        )}
        {["ACCEPTED", "ON_WAY"].includes(status) && (
          <button className="btn hivis s" disabled={busy} onClick={() => setOtpOpen((v) => !v)}>Enter start code</button>
        )}
        {status === "STARTED" && (
          <button className="btn green s" disabled={busy} onClick={() => act("complete")}>Mark job complete</button>
        )}
        {["ACCEPTED", "ON_WAY", "STARTED"].includes(status) && (
          <button className="btn danger s" disabled={busy}
            onClick={() => { if (confirm("Return this job to other professionals?")) act("release"); }}>
            I cannot do it
          </button>
        )}
      </div>

      {blocked && status === "OPEN" && (
        <p className="xs muted mt8">Finish your current job before accepting another.</p>
      )}

      {otpOpen && (
        <div className="card mt16" style={{ textAlign: "left" }}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor={`otp-${id}`}>Customer&apos;s start code</label>
            <input id={`otp-${id}`} inputMode="numeric" maxLength={4} value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="4 digits" />
            <p className="hint">Ask for it only after you reach the address.</p>
          </div>
          <button className="btn hivis s" disabled={busy || otp.length !== 4} onClick={() => act("start", { otp })}>
            Start work
          </button>
        </div>
      )}

      {error && <div className="notice error mt8" style={{ textAlign: "left" }}>{error}</div>}
    </div>
  );
}
