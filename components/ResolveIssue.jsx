"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveIssue({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resolve() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/issues/${id}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not resolve this issue. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn ghost s" disabled={busy} onClick={resolve}>
        {busy ? "Saving…" : "Mark resolved"}
      </button>
      {error && <div className="notice error mt8" role="alert">{error}</div>}
    </>
  );
}
