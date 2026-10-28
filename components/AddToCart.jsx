"use client";
import { useCart } from "./CartProvider";

export default function AddToCart({ serviceId, free }) {
  const { qty, add, remove, ready } = useCart();
  const n = qty(serviceId);

  if (!ready) return <span className="btn ghost s mt8" aria-hidden="true">Add</span>;
  if (!n) {
    return (
      <button className="btn ghost s mt8" onClick={() => add(serviceId)}>
        {free ? "Book visit" : "Add"}
      </button>
    );
  }
  return (
    <div className="stepper">
      <button onClick={() => remove(serviceId)} aria-label="Remove one">−</button>
      <span aria-live="polite">{n}</span>
      <button onClick={() => add(serviceId)} aria-label="Add one">+</button>
    </div>
  );
}
