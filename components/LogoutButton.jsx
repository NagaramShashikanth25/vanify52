"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton({ label = "Log out" }) {
  const router = useRouter();
  async function out() {
    await fetch("/api/auth/logout", { method: "POST" });
    try { window.localStorage.removeItem("vanify_cart"); } catch {}
    router.push("/");
    router.refresh();
  }
  return <button onClick={out}>{label}</button>;
}
