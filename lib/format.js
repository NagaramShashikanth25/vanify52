import { SLOTS, SLOT_START_HOURS } from "./config.js";

export const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

/** SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC; make that a real Date. */
export function parseStamp(value) {
  if (value instanceof Date) return value;
  const s = String(value || "").trim();
  if (!s) return new Date(NaN);
  return new Date(/[TZ]/.test(s) ? s : s.replace(" ", "T") + "Z");
}

export function timeAgo(date) {
  const t = parseStamp(date).getTime();
  if (Number.isNaN(t)) return "recently";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + " hr ago";
  return Math.round(hrs / 24) + " days ago";
}

/*
 * Dates. Every job happens in Hyderabad, so "today" means today in India — not
 * the server's clock (UTC on Vercel) and not whatever zone a phone is set to.
 * Bookings store the plain date, "2026-10-29".
 */
const IST = "Asia/Kolkata";
const DAY_MS = 86400000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" in India, offset by whole days. India has no daylight saving. */
export function istDate(offsetDays = 0) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + offsetDays * DAY_MS));
}

/** Minutes since midnight, India time. */
export function istMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(Date.now()));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get("hour") * 60 + get("minute");
}

/** True once a slot has begun today, so it can no longer be booked for today. */
export function slotStarted(slot) {
  const i = SLOTS.indexOf(slot);
  return i >= 0 && istMinutesNow() >= SLOT_START_HOURS[i] * 60;
}

/** The bookable days: today and the next six, in India time. */
export function nextDays(count = 7) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const key = istDate(i);
    const d = new Date(key + "T00:00:00Z");
    out.push({
      key,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
      num: d.getUTCDate(),
    });
  }
  return out;
}

/** "2026-10-29" → "Thu, 29 Oct". Older rows that stored a word are shown as they are. */
export function formatDay(value) {
  const s = String(value || "");
  if (!ISO_DAY.test(s)) return s;
  return new Date(s + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

// Id and code generation lives in lib/ids.js (server only).
