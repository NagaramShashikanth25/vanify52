"use client";
import { useState } from "react";

const EMPTY_FORM = (zone) => ({ label: "Home", zone, line: "" });

export default function AddressManager({ initialAddresses, zones }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM(zones[0]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM(zones[0]));
    setError("");
    setMessage("");
    setAdding(true);
  }

  function startEdit(address) {
    setAdding(false);
    setEditingId(address.id);
    setForm({ label: address.label, zone: address.zone, line: address.line });
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setAdding(false);
    setEditingId(null);
    setError("");
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok || !data.address) {
        setError(data?.error || "Could not save this address. Please try again.");
        return;
      }
      setAddresses((current) => editingId
        ? current.map((item) => item.id === editingId ? data.address : item)
        : [...current, data.address]);
      setAdding(false);
      setEditingId(null);
      setMessage("Address saved.");
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this saved address? Past bookings will not be changed.")) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(data?.error || "Could not remove this address. Please try again.");
        return;
      }
      setAddresses((current) => current.filter((item) => item.id !== id));
      setMessage("Address removed. Past bookings are unchanged.");
    } catch {
      setError("Could not reach Vanify. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const showForm = adding || editingId;

  return (
    <section className="card profile-card mt16">
      <div className="row between">
        <div>
          <h2>Saved addresses</h2>
          <p className="sm muted mt8">Choose these faster when booking a service.</p>
        </div>
        <span className="sm muted">{addresses.length}</span>
      </div>
      {addresses.length > 0 && (
        <div className="saved-addresses mt16">
          {addresses.map((address) => (
            <article className="saved-address" key={address.id}>
              <div className="row between">
                <strong>{address.label}</strong>
                <div className="saved-address-actions">
                  <button className="linkbtn" type="button" disabled={busy} onClick={() => startEdit(address)}>Edit</button>
                  <button className="linkbtn danger-link" type="button" disabled={busy} onClick={() => remove(address.id)}>Remove</button>
                </div>
              </div>
              <span>{address.line}</span>
              <span>{address.zone}</span>
            </article>
          ))}
        </div>
      )}
      {!addresses.length && !showForm && (
        <p className="sm muted mt16">Addresses you use for bookings will appear here. You can also add one now.</p>
      )}
      {showForm ? (
        <form className="address-form mt16" onSubmit={save}>
          <div className="field">
            <label htmlFor="saved-address-label">Address label</label>
            <input id="saved-address-label" maxLength={40} value={form.label}
              onChange={(e) => setForm((value) => ({ ...value, label: e.target.value }))} placeholder="Home, Work…" />
          </div>
          <div className="field">
            <label htmlFor="saved-address-zone">Area</label>
            <select id="saved-address-zone" value={form.zone}
              onChange={(e) => setForm((value) => ({ ...value, zone: e.target.value }))}>
              {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="saved-address-line">Full address</label>
            <textarea id="saved-address-line" rows={3} maxLength={300} value={form.line}
              onChange={(e) => setForm((value) => ({ ...value, line: e.target.value }))}
              placeholder="Flat, building, street, landmark" />
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn green" type="submit" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
            <button className="btn ghost" type="button" disabled={busy} onClick={cancelEdit}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn ghost mt16" type="button" disabled={busy} onClick={startAdd}>Add an address</button>
      )}
      {error && <div className="notice error mt16" role="alert">{error}</div>}
      {message && <div className="notice green mt16" role="status">{message}</div>}
    </section>
  );
}
