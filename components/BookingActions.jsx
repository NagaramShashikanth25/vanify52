"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookingActions({ id, status, rating }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(body) {
    setError(null); setBusy(true);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return false; }
    router.refresh();
    return true;
  }

  return (
    <>
      {status === "COMPLETED" && !rating && (
        <div className="card mt16">
          <h4>Rate this job</h4>
          <p className="sm muted mt8">Ratings decide which professionals keep getting work.</p>
          <div className="row mt16" style={{ gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className="btn ghost s" disabled={busy} onClick={() => send({ action: "rate", rating: n })}>
                {n} ★
              </button>
            ))}
          </div>
        </div>
      )}

      {rating ? <div className="notice green mt16">You rated this job {rating} ★. Thank you.</div> : null}

      {["SEARCHING", "ACCEPTED"].includes(status) && (
        <button className="btn danger full mt16" disabled={busy}
          onClick={() => { if (confirm("Cancel this booking?")) send({ action: "cancel" }); }}>
          Cancel booking
        </button>
      )}

      {!issueOpen && !sent && (
        <button className="btn ghost full mt16" onClick={() => setIssueOpen(true)}>Report a problem</button>
      )}

      {issueOpen && !sent && (
        <div className="card mt16">
          <div className="field">
            <label htmlFor="issue">What went wrong?</label>
            <textarea id="issue" rows={3} value={issueText} onChange={(e) => setIssueText(e.target.value)}
              placeholder="The work was left half finished." />
          </div>
          <div className="row end" style={{ gap: 8 }}>
            <button className="btn ghost s" onClick={() => setIssueOpen(false)}>Cancel</button>
            <button className="btn s" disabled={busy}
              onClick={async () => { if (await send({ action: "issue", text: issueText })) { setSent(true); setIssueOpen(false); } }}>
              Send to support
            </button>
          </div>
        </div>
      )}

      {sent && <div className="notice green mt16">Your report was sent. Visit Help &amp; FAQs if you need to contact Vanify about it.</div>}
      {error && <div className="notice error mt16">{error}</div>}
    </>
  );
}
