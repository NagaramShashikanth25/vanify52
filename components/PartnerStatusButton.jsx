"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerStatusButton({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function set(next) {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not update this professional. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const button = status === "APPROVED"
    ? <button type="button" className="btn danger s" disabled={busy} onClick={() => set("SUSPENDED")}>Suspend</button>
    : <button type="button" className="btn green s" disabled={busy} onClick={() => set("APPROVED")}>Approve</button>;

  return <>{button}{error && <div className="notice error mt8" role="alert">{error}</div>}</>;
}
