"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderClient from "@/components/HeaderClient";
import SiteFooterClient from "@/components/SiteFooterClient";
import { useCart } from "@/components/CartProvider";
import { BOOKING_DAYS, PLATFORM_FEE, SLOTS, ZONES } from "@/lib/config";
import { money, nextDays, slotStarted } from "@/lib/format";
import MixedTradeNotice, { cartTrades } from "@/components/MixedTradeNotice";

const DAYS = nextDays(BOOKING_DAYS);
const TODAY = DAYS[0].key;
// After the last slot has begun, today has nothing left, so start on tomorrow.
const OPEN_TODAY = SLOTS.find((s) => !slotStarted(s));
const FIRST_DAY = OPEN_TODAY ? TODAY : DAYS[1].key;
const FIRST_SLOT = FIRST_DAY === TODAY && slotStarted(SLOTS[3]) ? OPEN_TODAY : SLOTS[3];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, clear } = useCart();

  const [me, setMe] = useState(undefined);
  const [catalogue, setCatalogue] = useState(null);
  const [categories, setCategories] = useState([]);
  const [day, setDayRaw] = useState(FIRST_DAY);
  const [slot, setSlot] = useState(FIRST_SLOT);
  const closed = (s) => day === TODAY && slotStarted(s);
  const setDay = (key) => {
    setDayRaw(key);
    if (key === TODAY && slotStarted(slot) && OPEN_TODAY) setSlot(OPEN_TODAY);
  };
  const [zone, setZone] = useState(ZONES[0]);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setMe(d.user);
      if (!d.user) router.replace("/login?next=/checkout");
      const a = d.addresses?.[0];
      if (a) { setAddress(a.line); setZone(a.zone); }
    });
    fetch("/api/services").then((r) => r.json()).then((d) => { setCatalogue(d.services); setCategories(d.categories || []); });
  }, [router]);

  const lines = (catalogue || []).filter((s) => items[s.id] > 0).map((s) => ({ ...s, q: items[s.id] }));
  const total = lines.reduce((sum, l) => sum + l.price * l.q, 0);
  const mixed = cartTrades(lines, categories).length > 1;

  async function place() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: items, zone, address, note, day, slot }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setBusy(false); return; }
      clear();
      router.push(`/account/bookings/${data.id}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (me === undefined || catalogue === null) {
    return (<><HeaderClient /><main className="section"><div className="wrap narrow"><p className="muted">Loading…</p></div></main></>);
  }

  if (!count) {
    return (
      <>
        <HeaderClient />
        <main className="section flush" style={{ paddingTop: 44, minHeight: "60vh" }}>
          <div className="wrap narrow card center" style={{ padding: 40 }}>
            <h3>Your cart is empty</h3>
            <p className="muted mt8">Add a service before choosing a slot.</p>
            <Link className="btn mt24" href="/services">Browse services</Link>
          </div>
        </main>
        <SiteFooterClient />
      </>
    );
  }

  return (
    <>
      <HeaderClient />
      <main className="section flush" style={{ paddingTop: 40 }}>
        <div className="wrap narrow">
          <Link className="linkbtn" href="/cart">← Back to cart</Link>
          <h1 className="mt16" style={{ fontSize: "2rem" }}>When should we come?</h1>

          <div className="card mt24">
            <h4>Pick a day</h4>
            <div className="dayrow mt16">
              {DAYS.map((d) => (
                <button key={d.key} className="choice" aria-pressed={day === d.key}
                  disabled={d.key === TODAY && !OPEN_TODAY} onClick={() => setDay(d.key)}>
                  <strong>{d.num}</strong>{d.label}
                </button>
              ))}
            </div>

            <h4 className="mt24">Pick a time</h4>
            <div className="choices mt16">
              {SLOTS.map((s) => (
                <button key={s} className="choice" aria-pressed={slot === s} disabled={closed(s)}
                  onClick={() => setSlot(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="card mt16">
            <h4>Where?</h4>
            <div className="field mt16">
              <label htmlFor="zone">Area</label>
              <select id="zone" value={zone} onChange={(e) => setZone(e.target.value)}>
                {ZONES.map((z) => <option key={z}>{z}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="address">Full address</label>
              <input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat, building, street, landmark" />
              <p className="hint">Shared with the professional only after they accept the job.</p>
            </div>
            <div className="field">
              <label htmlFor="note">Anything we should know? (optional)</label>
              <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Second floor, no lift. Please call before coming." />
            </div>
          </div>

          <div className="card mt16">
            {lines.map((l) => (
              <div className="row between sm" key={l.id} style={{ marginBottom: 8 }}>
                <span>{l.name} × {l.q}</span><span className="price">{money(l.price * l.q)}</span>
              </div>
            ))}
            <div className="row between sm"><span>Platform fee</span><span className="price">{money(PLATFORM_FEE)}</span></div>
            <hr className="mt16" />
            <div className="row between mt16">
              <strong>Pay after the service</strong><strong className="price">{money(total + PLATFORM_FEE)}</strong>
            </div>
          </div>

          <MixedTradeNotice lines={lines} categories={categories} />
          {error && <div className="notice error mt16">{error}</div>}

          <button className="btn hivis full mt24" onClick={place} disabled={busy || closed(slot) || mixed}>
            {busy ? "Sending to professionals…" : "Confirm booking"}
          </button>
          <p className="xs muted mt8 center">Cash or UPI, after the job is done.</p>
        </div>
      </main>
      <SiteFooterClient />
    </>
  );
}
