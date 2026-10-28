"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerStatusButton({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next) {
    setBusy(true);
    await fetch(`/api/admin/partners/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  if (status === "APPROVED") {
    return <button className="btn danger s" disabled={busy} onClick={() => set("SUSPENDED")}>Suspend</button>;
  }
  return <button className="btn green s" disabled={busy} onClick={() => set("APPROVED")}>Approve</button>;
}
