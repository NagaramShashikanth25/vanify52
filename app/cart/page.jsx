"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SiteFooterClient from "@/components/SiteFooterClient";
import HeaderClient from "@/components/HeaderClient";
import { useCart } from "@/components/CartProvider";
import { PLATFORM_FEE } from "@/lib/config";
import { money } from "@/lib/format";
import MixedTradeNotice, { cartTrades } from "@/components/MixedTradeNotice";
import RecentBookings from "@/components/RecentBookings";

export default function CartPage() {
  const { items, qty, add, remove, count } = useCart();
  const [catalogue, setCatalogue] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pricesVisible, setPricesVisible] = useState(false);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => {
      setCatalogue(d.services);
      setCategories(d.categories || []);
      setPricesVisible(Boolean(d.pricesVisible));
    })
      .catch(() => setCatalogue([]));
  }, []);

  const lines = (catalogue || []).filter((s) => items[s.id] > 0).map((s) => ({ ...s, q: items[s.id] }));
  const total = lines.reduce((sum, l) => sum + l.price * l.q, 0);
  const mixed = cartTrades(lines, categories).length > 1;

  return (
    <>
      <HeaderClient />
      <main className="section flush" style={{ paddingTop: 44, minHeight: "64vh" }}>
        <div className="wrap narrow">
          <h1 style={{ fontSize: "2rem" }}>Your cart</h1>

          {!catalogue && <p className="muted mt24">Loading your cart…</p>}

          {catalogue && !count && (
            <div className="card mt24 center" style={{ padding: 40 }}>
              <h3>Your cart is empty</h3>
              <p className="muted mt8">Pick a service and it will show up here.</p>
              <Link className="btn mt24" href="/services">Browse services</Link>
            </div>
          )}

          {catalogue && count > 0 && (
            <>
              <div className="card mt24">
                {lines.map((l) => (
                  <div className="svc" key={l.id}>
                    <div>
                      <strong>{l.name}</strong>
                      <div className="detail">{l.detail}</div>
                    </div>
                    <div className="right">
                      {pricesVisible && <div className="price">{money(l.price * l.q)}</div>}
                      <div className="stepper">
                        <button onClick={() => remove(l.id)} aria-label={`Remove one ${l.name}`}>−</button>
                        <span>{qty(l.id)}</span>
                        <button onClick={() => add(l.id)} aria-label={`Add one ${l.name}`}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pricesVisible ? (
                <div className="card mt16">
                  <div className="row between"><span>Item total</span><span className="price">{money(total)}</span></div>
                  <div className="row between mt8"><span>Platform fee</span><span className="price">{money(PLATFORM_FEE)}</span></div>
                  <hr className="mt16" />
                  <div className="row between mt16">
                    <strong>Payable after the service</strong>
                    <strong className="price">{money(total + PLATFORM_FEE)}</strong>
                  </div>
                  <p className="xs muted mt8">Nothing is charged now. Pay by cash or UPI once the job is finished.</p>
                </div>
              ) : (
                <div className="notice green mt16">
                  Sign in or create a free account to view prices and continue to booking.
                </div>
              )}

              <MixedTradeNotice lines={lines} categories={categories} />

              {pricesVisible
                ? <Link className="btn hivis full mt24" href="/checkout" aria-disabled={mixed}>Choose a slot</Link>
                : <Link className="btn green full mt24" href="/register?next=%2Fcart">Create an account to continue</Link>}
            </>
          )}
          {catalogue && <RecentBookings />}
        </div>
      </main>
      <SiteFooterClient />
    </>
  );
}
