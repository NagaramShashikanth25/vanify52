"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "vanify_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState({});   // { [serviceId]: qty }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const api = useMemo(() => ({
    items,
    ready,
    count: Object.values(items).reduce((a, b) => a + b, 0),
    qty: (id) => items[id] || 0,
    add: (id) => setItems((s) => ({ ...s, [id]: (s[id] || 0) + 1 })),
    remove: (id) => setItems((s) => {
      const next = { ...s, [id]: (s[id] || 0) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    }),
    clear: () => setItems({}),
  }), [items, ready]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
