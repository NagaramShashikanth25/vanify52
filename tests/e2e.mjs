/**
 * End-to-end tests. Drives a running production build (`next start`) over HTTP and
 * checks the database directly, the same way Vercel + Neon would run it.
 *
 *   1. Start Postgres you can throw away (never production).
 *   2. npm run build
 *   3. DATABASE_URL=postgres://…localhost… npx next start -p 3100
 *   4. DATABASE_URL=postgres://…localhost… npm run test:e2e
 *
 * The suite rebuilds the database before it runs, so it refuses any DATABASE_URL
 * that is not on this machine.
 */
import { execFileSync } from "node:child_process";
import pg from "pg";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const DB = process.env.DATABASE_URL || "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(DB)) {
  console.error("Refusing to run: DATABASE_URL must point at a local throwaway database.");
  process.exit(2);
}

// Fresh schema + demo data for every run.
execFileSync("node", ["scripts/setup-db.mjs", "--force", "--demo"], { stdio: "ignore", env: process.env });

const db = new pg.Client({ connectionString: DB });
await db.connect();
const q1 = async (sql, p = []) => (await db.query(sql, p)).rows[0];

/* ---------------- tiny HTTP client with its own cookie jar ---------------- */
let ipSeq = 10;
class Browser {
  constructor() { this.jar = {}; this.ip = `10.0.0.${ipSeq++}`; }
  async req(path, { method = "GET", body, origin = BASE, headers = {} } = {}) {
    const h = { "x-forwarded-for": this.ip, ...headers };
    const cookie = Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookie) h.cookie = cookie;
    if (body !== undefined) h["content-type"] = "application/json";
    if (method !== "GET" && origin) h.origin = origin;
    const res = await fetch(BASE + path, {
      method, headers: h, redirect: "manual",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      const k = kv.slice(0, i), v = kv.slice(i + 1);
      if (v) this.jar[k] = v; else delete this.jar[k];
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text, headers: res.headers };
  }
  post(path, body, opts = {}) { return this.req(path, { method: "POST", body, ...opts }); }
  login(phone, password = "password123") { return this.post("/api/auth/login", { phone, password }); }
}

/* ---------------- fixtures ---------------- */
let phoneSeq = 9700000000;
const nextPhone = () => String(++phoneSeq);

const ist = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d); // YYYY-MM-DD
};
const TOMORROW = ist(1);
const SLOT = "4:00 PM – 5:00 PM";

const services = (await (await fetch(BASE + "/api/services")).json()).services;
const svc = (name) => {
  const s = services.find((x) => x.name === name);
  if (!s) throw new Error("No service " + name);
  return s;
};

async function newCustomer() {
  const b = new Browser();
  const r = await b.post("/api/auth/register", { name: "Test Customer", phone: nextPhone(), password: "password123" });
  if (r.status !== 200) throw new Error("register failed " + r.status + " " + r.text);
  return b;
}

const admin = new Browser();
{
  const r = await admin.login("9000000000");
  if (r.status !== 200) throw new Error("admin login failed: " + r.text);
}

async function newPartner(skills, zones) {
  const b = new Browser();
  const phone = nextPhone();
  const r = await b.post("/api/partner/register", { name: "Test Pro " + phone.slice(-3), phone, password: "password123", skills, zones });
  if (r.status !== 200) throw new Error("partner register failed " + r.text);
  const p = await q1("SELECT p.id FROM partners p JOIN users u ON u.id = p.user_id WHERE u.phone = $1", [phone]);
  const a = await admin.post(`/api/admin/partners/${p.id}`, { status: "APPROVED" });
  if (a.status !== 200) throw new Error("approve failed " + a.text);
  b.partnerId = p.id;
  b.phone = phone;
  return b;
}

async function book(customer, { items = { [svc("Fan repair or replacement").id]: 1 }, zone = "LB Nagar",
  day = TOMORROW, slot = SLOT, address = "Flat 9, Test Towers, Road 1" } = {}) {
  const r = await customer.post("/api/bookings", { cart: items, zone, address, day, slot });
  if (r.status !== 200) throw new Error("booking failed " + r.status + " " + r.text);
  return r.json.id;
}
const job = (partner, id, action, extra = {}) => partner.post(`/api/partner/jobs/${id}`, { action, ...extra });
const otpOf = async (id) => (await q1("SELECT otp FROM bookings WHERE id = $1", [id])).otp;

/* ---------------- runner ---------------- */
const results = [];
async function test(group, name, fn) {
  try {
    await fn();
    results.push({ group, name, ok: true });
  } catch (e) {
    results.push({ group, name, ok: false, why: e.message });
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (a, b, msg) => expect(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);

/* ======================================================================
 * CORE RULES FROM THE HANDOFF — these must pass before and after changes
 * ==================================================================== */
const CORE = "Core rules";

await test(CORE, "Wrong password and unknown number get the same reply", async () => {
  const a = await new Browser().login("9999900000", "wrong-password");
  const b = await new Browser().login("9123456780", "wrong-password");
  eq(a.status, 401, "wrong password status");
  eq(b.status, 401, "unknown number status");
  eq(a.json.error, b.json.error, "messages differ");
});

await test(CORE, "Login is throttled after 5 tries on one number", async () => {
  const b = new Browser();
  let last;
  for (let i = 0; i < 6; i++) last = await b.login("9888800000", "nope");
  eq(last.status, 429, "6th attempt");
});

await test(CORE, "A customer cannot open the Ops console or call staff APIs", async () => {
  const c = await newCustomer();
  const page = await c.req("/admin");
  expect([302, 303, 307, 308].includes(page.status), "expected a redirect, got " + page.status);
  expect(!page.headers.get("location")?.includes("/admin"), "redirected into admin");
  const api = await c.post("/api/admin/partners/anything", { status: "APPROVED" });
  eq(api.status, 403, "staff API");
});

await test(CORE, "Signed-out visitors are sent to /login from protected pages", async () => {
  const r = await new Browser().req("/account/bookings");
  expect([302, 303, 307, 308].includes(r.status), "status " + r.status);
  expect(r.headers.get("location").includes("/login"), "location " + r.headers.get("location"));
});

await test(CORE, "An open request hides address, phone and start code until accepted", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Secunderabad"]);
  const address = "Flat 77 Hidden Heights " + Date.now();
  const id = await book(c, { zone: "Secunderabad", address });
  const otp = await otpOf(id);
  const phone = (await q1("SELECT u.phone FROM bookings b JOIN users u ON u.id = b.customer_id WHERE b.id = $1", [id])).phone;
  const before = await pro.req("/partner/dashboard");
  expect(before.text.includes("Fan repair"), "open job not shown");
  expect(!before.text.includes("Hidden Heights"), "address leaked before accept");
  expect(!before.text.includes(phone), "customer phone leaked before accept");
  expect(!before.text.includes(`"${otp}"`) && !before.text.includes(`>${otp}<`), "start code leaked");
  eq((await job(pro, id, "accept")).status, 200, "accept");
  const after = await pro.req("/partner/dashboard");
  expect(after.text.includes("Hidden Heights"), "address not released after accept");
});

await test(CORE, "A plumber does not see electrical requests in his own area", async () => {
  const c = await newCustomer();
  const plumber = await newPartner(["plumbing"], ["Ameerpet"]);
  const marker = "Plumber-must-not-see " + Date.now();
  await book(c, { zone: "Ameerpet", address: marker });
  const r = await plumber.req("/partner/dashboard");
  expect(!r.text.includes("Fan repair"), "electrical job shown to a plumber");
});

await test(CORE, "Two professionals tapping Accept together: exactly one wins", async () => {
  const c = await newCustomer();
  const a = await newPartner(["electrical"], ["Gachibowli"]);
  const b = await newPartner(["electrical"], ["Gachibowli"]);
  const id = await book(c, { zone: "Gachibowli" });
  const [ra, rb] = await Promise.all([job(a, id, "accept"), job(b, id, "accept")]);
  const codes = [ra.status, rb.status].sort();
  eq(JSON.stringify(codes), JSON.stringify([200, 409]), "accept results");
});

await test(CORE, "Wrong start code is refused, and guessing is capped at 5", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Kondapur"]);
  const id = await book(c, { zone: "Kondapur" });
  await job(pro, id, "accept");
  const otp = await otpOf(id);
  const wrong = otp === "1111" ? "2222" : "1111";
  eq((await job(pro, id, "start", { otp: wrong })).status, 400, "first wrong code");
  for (let i = 0; i < 4; i++) await job(pro, id, "start", { otp: wrong });
  eq((await job(pro, id, "start", { otp })).status, 429, "6th try even with the right code");
});

await test(CORE, "Full job: commission is written at completion; customer never sees it", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Madhapur"]);
  const id = await book(c, { zone: "Madhapur", items: { [svc("Inverter servicing").id]: 2 } });
  await job(pro, id, "accept");
  eq((await job(pro, id, "on_way")).status, 200, "on_way");
  eq((await job(pro, id, "start", { otp: await otpOf(id) })).status, 200, "start");
  eq((await job(pro, id, "complete")).status, 200, "complete");
  const row = await q1("SELECT status, items_total, commission FROM bookings WHERE id = $1", [id]);
  eq(row.status, "COMPLETED", "status");
  eq(row.items_total, 798, "items_total from DB prices");
  eq(row.commission, 0, "new partner's first jobs are commission-free");
  const page = await c.req(`/account/bookings/${id}`);
  expect(!/commission|vanify fee/i.test(page.text), "commission text on customer page");
});

await test(CORE, "Commission applies after the free jobs and does not change later", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Miyapur"]);
  await db.query("UPDATE partners SET jobs_done = 25 WHERE id = $1", [pro.partnerId]);
  const id = await book(c, { zone: "Miyapur", items: { [svc("Inverter servicing").id]: 1 } });
  await job(pro, id, "accept");
  await job(pro, id, "start", { otp: await otpOf(id) });
  await job(pro, id, "complete");
  eq((await q1("SELECT commission FROM bookings WHERE id = $1", [id])).commission, 48, "12% of 399");
});

await test(CORE, "Prices come from the database, not the browser", async () => {
  const c = await newCustomer();
  const r = await c.post("/api/bookings", {
    cart: { [svc("Bathroom deep clean").id]: 2 }, zone: "Kondapur", address: "Flat 1, Some Building",
    day: TOMORROW, slot: SLOT, price: 1, items_total: 1,
  });
  eq(r.status, 200, "booking");
  eq((await q1("SELECT items_total FROM bookings WHERE id = $1", [r.json.id])).items_total, 1098, "total");
});

await test(CORE, "A customer cannot open someone else's booking", async () => {
  const a = await newCustomer();
  const b = await newCustomer();
  const id = await book(a);
  const r = await b.req(`/account/bookings/${id}`);
  eq(r.status, 404, "status");
  eq((await b.post(`/api/bookings/${id}`, { action: "cancel" })).status, 404, "cancel someone else's");
});

await test(CORE, "Cross-site POST to bookings is refused", async () => {
  const c = await newCustomer();
  const r = await c.post("/api/bookings", { cart: {} }, { origin: "https://evil.example" });
  eq(r.status, 403, "status");
});

await test(CORE, "Security headers are sent", async () => {
  const r = await new Browser().req("/");
  for (const h of ["content-security-policy", "x-frame-options", "strict-transport-security", "x-content-type-options"]) {
    expect(r.headers.get(h), "missing " + h);
  }
  expect(!r.headers.get("x-powered-by"), "x-powered-by present");
});

/* ======================================================================
 * BUGS FOUND IN REVIEW — each test reproduces one mistake
 * ==================================================================== */
const BUG = "Bugs found in review";

await test(BUG, "1. A partner cannot work a job the customer cancelled", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Kukatpally"]);
  const id = await book(c, { zone: "Kukatpally" });
  await job(pro, id, "accept");
  const otp = await otpOf(id);
  eq((await c.post(`/api/bookings/${id}`, { action: "cancel" })).status, 200, "customer cancel");
  await job(pro, id, "on_way");
  await job(pro, id, "start", { otp });
  await job(pro, id, "complete");
  eq((await q1("SELECT status FROM bookings WHERE id = $1", [id])).status, "CANCELLED", "cancelled job changed status");
});

await test(BUG, "2. A finished job cannot be released back to the queue", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Kukatpally"]);
  const id = await book(c, { zone: "Kukatpally" });
  await job(pro, id, "accept");
  await job(pro, id, "start", { otp: await otpOf(id) });
  await job(pro, id, "complete");
  await job(pro, id, "release");
  const row = await q1("SELECT status, partner_id FROM bookings WHERE id = $1", [id]);
  eq(row.status, "COMPLETED", "status after release");
  eq(row.partner_id, pro.partnerId, "partner removed from a finished job");
});

await test(BUG, "3. A finished job cannot be restarted and completed again", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Kukatpally"]);
  const id = await book(c, { zone: "Kukatpally" });
  await job(pro, id, "accept");
  const otp = await otpOf(id);
  await job(pro, id, "start", { otp });
  await job(pro, id, "complete");
  await job(pro, id, "start", { otp });
  await job(pro, id, "complete");
  eq((await q1("SELECT jobs_done FROM partners WHERE id = $1", [pro.partnerId])).jobs_done, 1, "jobs_done");
});

await test(BUG, "4. Double-tapping 'complete' counts the job once", async () => {
  const c = await newCustomer();
  const pro = await newPartner(["electrical"], ["Kukatpally"]);
  const id = await book(c, { zone: "Kukatpally" });
  await job(pro, id, "accept");
  await job(pro, id, "start", { otp: await otpOf(id) });
  await Promise.all([1, 2, 3, 4, 5].map(() => job(pro, id, "complete")));
  eq((await q1("SELECT jobs_done FROM partners WHERE id = $1", [pro.partnerId])).jobs_done, 1, "jobs_done");
});

await test(BUG, "5. A partner cannot accept a job outside his trade or area", async () => {
  const c = await newCustomer();
  const plumber = await newPartner(["plumbing"], ["Ameerpet"]);
  const id = await book(c, { zone: "Kukatpally" }); // electrical, other area
  const r = await job(plumber, id, "accept");
  expect(r.status !== 200, "plumber accepted an electrical job in another area");
  eq((await q1("SELECT status FROM bookings WHERE id = $1", [id])).status, "SEARCHING", "status");
});

await test(BUG, "6. The booking day is stored as a real date, not 'Today'", async () => {
  const c = await newCustomer();
  const r = await c.post("/api/bookings", {
    cart: { [svc("Fan repair or replacement").id]: 1 }, zone: "LB Nagar",
    address: "Flat 2, Day Test Building", day: "Today", slot: SLOT,
  });
  eq(r.status, 400, "'Today' should be refused — it means a different day tomorrow");
  const ok = await c.post("/api/bookings", {
    cart: { [svc("Fan repair or replacement").id]: 1 }, zone: "LB Nagar",
    address: "Flat 2, Day Test Building", day: TOMORROW, slot: SLOT,
  });
  eq(ok.status, 200, "ISO date");
  eq((await q1("SELECT day FROM bookings WHERE id = $1", [ok.json.id])).day, TOMORROW, "stored day");
  const past = await c.post("/api/bookings", {
    cart: { [svc("Fan repair or replacement").id]: 1 }, zone: "LB Nagar",
    address: "Flat 2, Day Test Building", day: ist(-1), slot: SLOT,
  });
  eq(past.status, 400, "yesterday should be refused");
});

await test(BUG, "7. A cart mixing two trades is not sent to only one of them", async () => {
  const c = await newCustomer();
  const r = await c.post("/api/bookings", {
    cart: { [svc("Fan repair or replacement").id]: 1, [svc("Tap or mixer repair").id]: 1 },
    zone: "Kukatpally", address: "Flat 3, Mixed Cart Building", day: TOMORROW, slot: SLOT,
  });
  eq(r.status, 400, "mixed electrical + plumbing cart");
});

await test(BUG, "8. A customer who adds a partner profile can open the partner dashboard", async () => {
  const c = await newCustomer();
  const r = await c.post("/api/partner/register", { skills: ["painting"], zones: ["LB Nagar"] });
  eq(r.status, 200, "upgrade");
  const page = await c.req("/partner/dashboard");
  eq(page.status, 200, "dashboard status (redirected away?)");
  expect(page.text.includes("Verification pending") || page.text.includes("checking your details"), "pending screen not shown");
});

await test(BUG, "9. Password sign-in to a Google-only account gives 401, not a crash", async () => {
  const phone = nextPhone();
  await db.query(
    "INSERT INTO users (id, name, phone, email, google_id, role) VALUES ($1,'G User',$2,$3,$4,'CUSTOMER')",
    ["u_g" + phone, phone, `g${phone}@example.com`, "gid-" + phone]);
  const r = await new Browser().login(phone, "anything123");
  eq(r.status, 401, "status");
});

await test(BUG, "10. Registering with an email that is already used gives a clear 400, not a crash", async () => {
  const email = `dup${Date.now()}@example.com`;
  const a = await new Browser().post("/api/auth/register", { name: "First", phone: nextPhone(), email, password: "password123" });
  eq(a.status, 200, "first");
  const b = await new Browser().post("/api/auth/register", { name: "Second", phone: nextPhone(), email, password: "password123" });
  eq(b.status, 400, "second");
  expect(b.json?.error, "no message");
});

await test(BUG, "11. Demo passwords are not printed on the live sign-in page", async () => {
  const r = await new Browser().req("/login");
  expect(!r.text.includes("password123"), "login page shows password123");
  const p = await new Browser().req("/partner");
  expect(!p.text.includes("password123"), "partner page shows password123");
});

await test(BUG, "12. Staff, partner and logout writes all check the request origin", async () => {
  const pro = await newPartner(["electrical"], ["Kukatpally"]);
  const evil = { origin: "https://evil.example" };
  eq((await admin.post("/api/admin/issues/x", {}, evil)).status, 403, "admin issues");
  eq((await pro.post("/api/partner/online", { online: false }, evil)).status, 403, "partner online");
  eq((await pro.post("/api/partner/coverage", { skills: ["painting"], zones: ["LB Nagar"] }, evil)).status, 403, "coverage");
});

await test(BUG, "13. A switched-off service cannot be booked from an old cart", async () => {
  const c = await newCustomer();
  const s = svc("Drawer or hinge fix");
  await db.query("UPDATE services SET active = false WHERE id = $1", [s.id]);
  try {
    const r = await c.post("/api/bookings", { cart: { [s.id]: 1 }, zone: "LB Nagar", address: "Flat 4, Old Cart Building", day: TOMORROW, slot: SLOT });
    eq(r.status, 400, "inactive service");
  } finally {
    await db.query("UPDATE services SET active = true WHERE id = $1", [s.id]);
  }
});

await test(BUG, "14. A fractional quantity does not crash the booking", async () => {
  const c = await newCustomer();
  const r = await c.post("/api/bookings", {
    cart: { [svc("Fan repair or replacement").id]: 1.5 }, zone: "LB Nagar",
    address: "Flat 5, Odd Qty Building", day: TOMORROW, slot: SLOT,
  });
  expect(r.status < 500, "server error " + r.status);
});

/* ======================================================================
 * SPEED — how many database round trips a page costs
 * ==================================================================== */
const PERF = "Speed";

// Counts statements the server actually ran, from the Postgres log
// (needs log_statement = 'all' and QUERY_LOG pointing at the log file).
const fs = await import("node:fs");
const LOG = process.env.QUERY_LOG;
async function countQueries(fn) {
  if (!LOG) throw new Error("set QUERY_LOG to the Postgres log file to measure queries");
  const start = fs.statSync(LOG).size;
  await fn();
  await new Promise((r) => setTimeout(r, 400));
  const fd = fs.openSync(LOG, "r");
  const buf = Buffer.alloc(fs.statSync(LOG).size - start);
  fs.readSync(fd, buf, 0, buf.length, start);
  fs.closeSync(fd);
  return buf.toString().split("\n").filter((l) => /LOG:\s+(statement|execute)/.test(l)).length;
}

const perf = {};
await test(PERF, "Ops bookings page with 200 bookings uses fewer than 20 queries", async () => {
  const c = await newCustomer();
  const cust = await q1("SELECT id FROM users ORDER BY created_at DESC LIMIT 1");
  const s = svc("Fan repair or replacement");
  for (let i = 0; i < 200; i++) {
    const id = "b_perf" + i;
    await db.query(
      `INSERT INTO bookings (id, ref, customer_id, category_id, zone, address, day, slot, items_total, fee, status, otp)
       VALUES ($1,$2,$3,'electrical','LB Nagar','x',$4,$5,199,19,'COMPLETED','1234')`,
      [id, "VNP" + i, cust.id, TOMORROW, SLOT]);
    await db.query("INSERT INTO booking_items (id, booking_id, service_id, name, price, qty) VALUES ($1,$2,$3,$4,199,1)",
      ["bi_perf" + i, id, s.id, s.name]);
  }
  void c;
  const n = await countQueries(async () => {
    const t0 = Date.now();
    const r = await admin.req("/admin/bookings");
    perf.adminBookingsMs = Date.now() - t0;
    eq(r.status, 200, "page");
  });
  perf.adminBookings = n;
  expect(n < 20, `${n} queries`);
});

await test(PERF, "Home page uses fewer than 5 queries", async () => {
  const n = await countQueries(async () => {
    eq((await new Browser().req("/")).status, 200, "page");
  });
  perf.home = n;
  expect(n < 5, `${n} queries`);
});

/* ---------------- report ---------------- */
await db.end();
let failed = 0;
for (const g of [CORE, BUG, PERF]) {
  const rows = results.filter((r) => r.group === g);
  console.log(`\n${g}  (${rows.filter((r) => r.ok).length}/${rows.length} pass)`);
  for (const r of rows) {
    if (!r.ok) failed++;
    console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "\n          → " + r.why}`);
  }
}
if (perf.adminBookings !== undefined) {
  console.log(`\n  measured: ops bookings page = ${perf.adminBookings} queries (${perf.adminBookingsMs} ms on a local database); home page = ${perf.home} queries`);
}
console.log(`\n${results.length - failed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
