"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ServiceSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/services/search?q=" + encodeURIComponent(q));
        const data = await res.json();
        setHits(data.services || []);
        setOpen(true);
      } catch {}
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", away);
    return () => document.removeEventListener("click", away);
  }, []);

  return (
    <div className="searchwrap" ref={box}>
      <div className="searchbox">
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)}
          placeholder="Search a service — fan repair, sofa cleaning, tempo…" aria-label="Search services" />
        <Link className="btn hivis" href="/services">Browse all</Link>
      </div>
      {open && q.trim().length >= 2 && (
        <div className="results">
          {hits.length ? hits.map((s) => (
            <Link key={s.id} href={`/services/${s.category_id}`} onClick={() => setOpen(false)}>
              <span>{s.name}</span>
              <span className="muted">{s.price ? "₹" + s.price : "Free visit"}</span>
            </Link>
          )) : (
            <div style={{ padding: "12px 14px", color: "var(--muted)", fontSize: ".9rem" }}>
              Nothing matches “{q}”. Try “fan”, “clean” or “tempo”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
