/**
 * Unit tests for the parts that are easiest to get subtly wrong.
 *   npm run test:unit
 * The Google account test needs a local throwaway DATABASE_URL; it is skipped without one.
 */
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, why: e.message }); }
}
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`); };

const RealDate = Date;
function at(iso, fn) {
  const fixed = new RealDate(iso).getTime();
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [fixed])); }
    static now() { return fixed; }
  };
  try { return fn(); } finally { globalThis.Date = RealDate; }
}

const format = await import("../lib/format.js");
const safe = await import("../lib/safe.js");

await test("Day picker: at 1:30 AM in Hyderabad, 'Today' is that calendar date", () => {
  // 20:00 UTC on 28 Oct is 01:30 IST on 29 Oct.
  const days = at("2026-10-28T20:00:00Z", () => format.nextDays(7));
  eq(days[0].label, "Today", "label");
  eq(days[0].num, 29, "number shown");
  eq(days[0].key, "2026-10-29", "date sent to the server");
});

await test("Day picker: number shown and date sent always agree", () => {
  for (const iso of ["2026-10-28T18:31:00Z", "2026-12-31T19:00:00Z", "2026-03-01T00:10:00Z"]) {
    const days = at(iso, () => format.nextDays(7));
    for (const d of days) eq(Number(d.key.slice(8)), d.num, `${iso} ${d.label}`);
  }
});

await test("Open redirects are blocked", () => {
  for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/x?u=https://e"]) {
    eq(safe.safeNext(bad, "/home"), "/home", bad);
  }
  eq(safe.safeNext("/account/bookings", "/home"), "/account/bookings", "same-site path");
});

await test("Google: the callback uses the domain the visitor is on, not the per-deploy VERCEL_URL", async () => {
  const google = await import("../lib/google.js");
  const saved = { ...process.env };
  try {
    delete process.env.APP_URL; delete process.env.GOOGLE_REDIRECT_URI;
    process.env.VERCEL_URL = "vanify-git-abc123-dinesh.vercel.app";
    // What Vercel sends, versus what `next start` reports as its own origin.
    const req = {
      headers: new Headers({ host: "vanify.vercel.app", "x-forwarded-proto": "https" }),
      nextUrl: { origin: "http://localhost:3000" },
    };
    eq(google.redirectUri(req), "https://vanify.vercel.app/api/auth/google/callback", "redirect uri");
    process.env.APP_URL = "https://vanify.in/";
    eq(google.redirectUri(req), "https://vanify.in/api/auth/google/callback", "APP_URL wins");
  } finally {
    process.env = saved;
  }
});

const DB = process.env.DATABASE_URL || "";
if (/@(localhost|127\.0\.0\.1)[:/]/.test(DB)) {
  await test("Google: an unverified email typed at sign-up cannot capture a Google account", async () => {
    const google = await import("../lib/google.js");
    if (typeof google.resolveGoogleUser !== "function") throw new Error("lib/google.js has no resolveGoogleUser — linking happens inline by email");
    const repo = await import("../lib/repo.js");
    const stamp = RealDate.now();
    const email = `victim${stamp}@example.com`;
    // Someone registers a password account using another person's email.
    const squatter = await repo.createUser({ name: "Squatter", phone: String(9600000000 + (stamp % 100000)), email, passwordHash: "x" });
    const result = await google.resolveGoogleUser({ googleId: "gid-" + stamp, email, name: "Victim", avatar: null });
    if (result.user && result.user.id === squatter.id) throw new Error("Google account was attached to the squatter's account");
    const after = await repo.findUserById(squatter.id);
    eq(after.google_id, null, "squatter's account got the Google id");
  });

  await test("Google: a new Google user gets a fresh customer account", async () => {
    const google = await import("../lib/google.js");
    if (typeof google.resolveGoogleUser !== "function") throw new Error("no resolveGoogleUser");
    const stamp = RealDate.now();
    const r = await google.resolveGoogleUser({ googleId: "gid-new-" + stamp, email: `new${stamp}@example.com`, name: "New", avatar: null });
    eq(r.user?.role, "CUSTOMER", "role");
    const again = await google.resolveGoogleUser({ googleId: "gid-new-" + stamp, email: `new${stamp}@example.com`, name: "New", avatar: null });
    eq(again.user?.id, r.user.id, "second sign-in finds the same account");
  });
} else {
  results.push({ name: "Google account tests skipped (no local DATABASE_URL)", ok: true });
}

let failed = 0;
console.log("\nUnit tests");
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "\n          → " + r.why}`);
}
console.log(`\n${results.length - failed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
