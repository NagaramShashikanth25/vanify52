"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveIssue({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function resolve() {
    setBusy(true);
    await fetch(`/api/admin/issues/${id}`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return <button className="btn ghost s" disabled={busy} onClick={resolve}>Mark resolved</button>;
}
