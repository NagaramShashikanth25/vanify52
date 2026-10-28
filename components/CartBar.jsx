"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartBar() {
  const { count } = useCart();
  if (!count) return null;
  return (
    <div className="stickybar">
      <div><strong>{count} item{count === 1 ? "" : "s"}</strong> <span className="muted">in your cart</span></div>
      <Link className="btn hivis" href="/cart">Go to cart</Link>
    </div>
  );
}
