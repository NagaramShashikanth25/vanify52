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

export function nextDays(count = 7) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.now() + i * 86400000);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      num: d.getDate(),
    });
  }
  return out;
}

// Id and code generation lives in lib/ids.js (server only).
