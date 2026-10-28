/**
 * Every database query the app makes lives here. Postgres dialect ($1 placeholders).
 * Nothing outside this file and lib/db.js contains SQL.
 */
import { all, one, run, placeholders } from "./db";
import { uid, makeOtp, makeRef } from "./ids";
import { COMMISSION, FREE_JOBS, PLATFORM_FEE } from "./config";

/* ---------------- catalogue ---------------- */
export const listCategories = () => all("SELECT * FROM categories ORDER BY sort");
export const getCategory = (id) => one("SELECT * FROM categories WHERE id = $1", [id]);

export const listServices = (categoryId) =>
  categoryId
    ? all("SELECT * FROM services WHERE category_id = $1 AND active ORDER BY price DESC", [categoryId])
    : all("SELECT * FROM services WHERE active ORDER BY category_id, price DESC");

export const getServices = (ids) =>
  ids.length ? all(`SELECT * FROM services WHERE active AND id IN (${placeholders(ids)})`, ids) : Promise.resolve([]);

export const searchServices = (q) =>
  all("SELECT * FROM services WHERE active AND name ILIKE $1 ORDER BY price LIMIT 8", [`%${q}%`]);

export const categoryMinPrice = async (id) =>
  (await one("SELECT MIN(price) AS min FROM services WHERE category_id = $1 AND price > 0", [id]))?.min ?? 0;

/* ---------------- users ---------------- */

/**
 * Two people submitting the same phone or email at the same instant both pass the
 * "is it taken?" check; the database's UNIQUE rule then stops the second insert.
 * Returns "phone" | "email" | "google" for that case, null for any other error.
 */
export function duplicateField(err) {
  if (err?.code !== "23505") return null;
  const where = `${err.constraint || ""} ${err.detail || ""} ${err.message || ""}`;
  if (where.includes("phone")) return "phone";
  if (where.includes("email")) return "email";
  if (where.includes("google")) return "google";
  return "unknown";
}
export const findUserByPhone = (phone) => one("SELECT * FROM users WHERE phone = $1", [phone]);
export const findUserById = (id) => one("SELECT * FROM users WHERE id = $1", [id]);
export const findUserByEmail = (email) => one("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
export const findUserByGoogleId = (gid) => one("SELECT * FROM users WHERE google_id = $1", [gid]);

export async function createUser({ name, phone = null, email = null, passwordHash = null, googleId = null, avatar = null, role = "CUSTOMER" }) {
  const id = uid("u_");
  await run(
    `INSERT INTO users (id, name, phone, email, password_hash, google_id, avatar, role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, name, phone, email, passwordHash, googleId, avatar, role]
  );
  return findUserById(id);
}

/** Links a Google account to an existing row (same email) that signed up with a password. */
export const linkGoogle = (userId, { googleId, avatar }) =>
  run("UPDATE users SET google_id = $1, avatar = COALESCE($2, avatar) WHERE id = $3", [googleId, avatar, userId]);

export const setUserPhone = (userId, phone) => run("UPDATE users SET phone = $1 WHERE id = $2", [phone, userId]);
export const setUserRole = (userId, role) => run("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);

export const listAddresses = (userId) => all("SELECT * FROM addresses WHERE user_id = $1", [userId]);

export async function saveAddress(userId, { zone, line, label = "Home" }) {
  const existing = await one("SELECT id FROM addresses WHERE user_id = $1 AND line = $2", [userId, line]);
  if (existing) return existing.id;
  const id = uid("ad_");
  await run("INSERT INTO addresses (id, user_id, label, zone, line) VALUES ($1,$2,$3,$4,$5)", [id, userId, label, zone, line]);
  return id;
}

/* ---------------- partners ---------------- */
export const getPartnerByUser = (userId) => one("SELECT * FROM partners WHERE user_id = $1", [userId]);
export const getPartner = (id) => one("SELECT * FROM partners WHERE id = $1", [id]);

export async function createPartner(userId, { skills, zones }) {
  const id = uid("p_");
  await run("INSERT INTO partners (id, user_id, skills, zones, status, online) VALUES ($1,$2,$3,$4,'PENDING',false)",
    [id, userId, skills.join(","), zones.join(",")]);
  return getPartner(id);
}

export const listPartners = () =>
  all(`SELECT p.*, u.name, u.phone, u.email, u.created_at AS joined
       FROM partners p JOIN users u ON u.id = p.user_id
       ORDER BY CASE p.status WHEN 'PENDING' THEN 0 ELSE 1 END, u.name`);

export const listApprovedPartners = () =>
  all(`SELECT p.*, u.name FROM partners p JOIN users u ON u.id = p.user_id
       WHERE p.status = 'APPROVED' ORDER BY p.rating DESC`);

export const partnerWithUser = (id) =>
  one("SELECT p.*, u.name, u.phone FROM partners p JOIN users u ON u.id = p.user_id WHERE p.id = $1", [id]);

export const setPartnerStatus = (id, status) =>
  run("UPDATE partners SET status = $1, online = $2 WHERE id = $3", [status, status === "APPROVED", id]);

export const setPartnerOnline = (id, online) =>
  run("UPDATE partners SET online = $1 WHERE id = $2", [!!online, id]);

export const setPartnerCoverage = (id, { skills, zones }) =>
  run("UPDATE partners SET skills = $1, zones = $2 WHERE id = $3", [skills.join(","), zones.join(","), id]);

/* ---------------- bookings ---------------- */
async function hydrate(b) {
  if (!b) return null;
  b.items = await all("SELECT * FROM booking_items WHERE booking_id = $1", [b.id]);
  b.events = await all("SELECT * FROM booking_events WHERE booking_id = $1 ORDER BY at", [b.id]);
  b.customer = await one("SELECT name, phone, email FROM users WHERE id = $1", [b.customer_id]);
  if (b.partner_id) b.partner = await partnerWithUser(b.partner_id);
  return b;
}
const hydrateAll = (rows) => Promise.all(rows.map(hydrate));

export const getBooking = async (id) => hydrate(await one("SELECT * FROM bookings WHERE id = $1", [id]));

export const listCustomerBookings = async (customerId) =>
  hydrateAll(await all("SELECT * FROM bookings WHERE customer_id = $1 ORDER BY created_at DESC", [customerId]));

export const listPartnerBookings = async (partnerId) =>
  hydrateAll(await all("SELECT * FROM bookings WHERE partner_id = $1 ORDER BY created_at DESC", [partnerId]));

export const activePartnerJob = async (partnerId) =>
  hydrate(await one("SELECT * FROM bookings WHERE partner_id = $1 AND status IN ('ACCEPTED','ON_WAY','STARTED') LIMIT 1", [partnerId]));

/** Open requests matching this partner's trades and areas. */
export async function openJobsFor(partner) {
  const skills = partner.skills.split(",").filter(Boolean);
  const zones = partner.zones.split(",").filter(Boolean);
  if (!skills.length || !zones.length) return [];
  const rows = await all(
    `SELECT * FROM bookings WHERE status = 'SEARCHING'
       AND category_id IN (${placeholders(skills)})
       AND zone IN (${placeholders(zones, skills.length + 1)})
     ORDER BY created_at`,
    [...skills, ...zones]
  );
  return hydrateAll(rows);
}

export const listAllBookings = async () =>
  hydrateAll(await all(
    `SELECT b.*, u.name AS customer_name, u.phone AS customer_phone, pu.name AS partner_name
     FROM bookings b
     JOIN users u ON u.id = b.customer_id
     LEFT JOIN partners p ON p.id = b.partner_id
     LEFT JOIN users pu ON pu.id = p.user_id
     ORDER BY b.created_at DESC`));

export async function createBooking({ customerId, items, categoryId, zone, address, note, day, slot }) {
  const id = uid("b_");
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  await run(
    `INSERT INTO bookings (id, ref, customer_id, category_id, zone, address, note, day, slot, items_total, fee, status, otp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SEARCHING',$12)`,
    [id, makeRef(), customerId, categoryId, zone, address, note || null, day, slot, itemsTotal, PLATFORM_FEE, makeOtp()]
  );
  for (const i of items) {
    await run("INSERT INTO booking_items (id, booking_id, service_id, name, price, qty) VALUES ($1,$2,$3,$4,$5,$6)",
      [uid("bi_"), id, i.id, i.name, i.price, i.qty]);
  }
  await addEvent(id, "Booking placed");
  return getBooking(id);
}

export const addEvent = (bookingId, label) =>
  run("INSERT INTO booking_events (id, booking_id, label) VALUES ($1,$2,$3)", [uid("ev_"), bookingId, label]);

/**
 * Every status change below is ONE conditional UPDATE that names the statuses it
 * may start from, the same pattern as accept. If the job has moved on (cancelled,
 * already finished, taken by someone else) the UPDATE matches zero rows and the
 * change is refused — so a double tap, a stale screen or a hand-made request can
 * never push a job backwards or finish it twice.
 */
const ok = (rows) => rows.length > 0;

/** The partner must cover the job's trade AND area, checked inside the same UPDATE. */
export async function acceptBooking(bookingId, partner, partnerName) {
  const skills = partner.skills.split(",").filter(Boolean);
  const zones = partner.zones.split(",").filter(Boolean);
  const res = await all(
    `UPDATE bookings SET partner_id = $1, status = 'ACCEPTED'
     WHERE id = $2 AND status = 'SEARCHING'
       AND category_id = ANY($3::text[]) AND zone = ANY($4::text[])
     RETURNING id`,
    [partner.id, bookingId, skills, zones]
  );
  if (!ok(res)) return false;
  await addEvent(bookingId, `${partnerName} accepted the job`);
  return true;
}

/** Partner-side moves: on the way, started. `from` lists the statuses allowed. */
export async function advanceBooking(bookingId, partnerId, from, to, label) {
  const res = await all(
    `UPDATE bookings SET status = $1
     WHERE id = $2 AND partner_id = $3 AND status = ANY($4::text[]) RETURNING id`,
    [to, bookingId, partnerId, from]
  );
  if (!ok(res)) return false;
  if (label) await addEvent(bookingId, label);
  return true;
}

/** Customer cancel: only before the professional is on the way. */
export async function cancelBooking(bookingId, customerId) {
  const res = await all(
    `UPDATE bookings SET status = 'CANCELLED'
     WHERE id = $1 AND customer_id = $2 AND status IN ('SEARCHING','ACCEPTED') RETURNING id`,
    [bookingId, customerId]
  );
  if (!ok(res)) return false;
  await addEvent(bookingId, "Cancelled by customer");
  return true;
}

/** A partner hands back a job that is still in progress — never a finished or cancelled one. */
export async function releaseBooking(bookingId, partnerId) {
  const res = await all(
    `UPDATE bookings SET partner_id = NULL, status = 'SEARCHING'
     WHERE id = $1 AND partner_id = $2 AND status IN ('ACCEPTED','ON_WAY','STARTED') RETURNING id`,
    [bookingId, partnerId]
  );
  if (!ok(res)) return false;
  await addEvent(bookingId, "Returned to other professionals");
  return true;
}

/**
 * Completes a STARTED job exactly once. The commission is worked out inside the
 * UPDATE from the partner's count at that moment and written onto the row, so
 * later rate changes never rewrite it. Returns null if the job was not STARTED.
 */
export async function completeBooking(bookingId, partnerId) {
  const res = await all(
    `UPDATE bookings b
        SET status = 'COMPLETED', paid_at = now(),
            commission = CASE WHEN p.jobs_done < $3 THEN 0
                              ELSE round(b.items_total * $4::numeric)::int END
       FROM partners p
      WHERE b.id = $1 AND b.partner_id = $2 AND p.id = b.partner_id AND b.status = 'STARTED'
      RETURNING b.items_total, b.commission`,
    [bookingId, partnerId, FREE_JOBS, COMMISSION]
  );
  if (!ok(res)) return null;
  await run("UPDATE partners SET jobs_done = jobs_done + 1 WHERE id = $1", [partnerId]);
  await addEvent(bookingId, "Job completed");
  const { items_total, commission } = res[0];
  return { commission, net: items_total - commission };
}

export async function rateBooking(bookingId, rating, review) {
  const b = await one("SELECT partner_id FROM bookings WHERE id = $1", [bookingId]);
  await run("UPDATE bookings SET rating = $1, review = $2 WHERE id = $3", [rating, review || null, bookingId]);
  if (b?.partner_id) {
    const agg = await one("SELECT AVG(rating) AS avg FROM bookings WHERE partner_id = $1 AND rating IS NOT NULL", [b.partner_id]);
    await run("UPDATE partners SET rating = $1 WHERE id = $2", [Math.round((Number(agg.avg) || 0) * 10) / 10, b.partner_id]);
  }
}

/* ---------------- issues + ops ---------------- */
export const createIssue = (bookingId, text) =>
  run("INSERT INTO issues (id, booking_id, text) VALUES ($1,$2,$3)", [uid("is_"), bookingId, text]);

export const listIssues = () =>
  all(`SELECT i.*, b.ref FROM issues i JOIN bookings b ON b.id = i.booking_id
       ORDER BY i.status, i.created_at DESC`);

export const resolveIssue = (id) => run("UPDATE issues SET status = 'RESOLVED' WHERE id = $1", [id]);

export async function opsStats() {
  const totals = await one(
    `SELECT COUNT(*)::int AS bookings,
            COALESCE(SUM(CASE WHEN status='COMPLETED' THEN items_total ELSE 0 END),0)::int AS gmv,
            COALESCE(SUM(CASE WHEN status='COMPLETED' THEN commission ELSE 0 END),0)::int AS commission,
            COALESCE(SUM(CASE WHEN status <> 'CANCELLED' THEN fee ELSE 0 END),0)::int AS fees
     FROM bookings`);
  const partners = await one(
    `SELECT COALESCE(SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END),0)::int AS approved,
            COALESCE(SUM(CASE WHEN status='PENDING'  THEN 1 ELSE 0 END),0)::int AS pending
     FROM partners`);
  const live = await hydrateAll(await all(
    `SELECT b.*, u.name AS customer_name, pu.name AS partner_name
     FROM bookings b JOIN users u ON u.id = b.customer_id
     LEFT JOIN partners p ON p.id = b.partner_id LEFT JOIN users pu ON pu.id = p.user_id
     WHERE b.status IN ('SEARCHING','ACCEPTED','ON_WAY','STARTED')
     ORDER BY b.created_at DESC`));

  return {
    bookings: totals.bookings,
    gmv: totals.gmv,
    commission: totals.commission,
    fees: totals.fees,
    revenue: totals.commission + totals.fees,
    approved: partners.approved,
    pending: partners.pending,
    live,
  };
}

export async function partnerEarnings(partnerId) {
  const rows = await hydrateAll(await all(
    "SELECT * FROM bookings WHERE partner_id = $1 AND status = 'COMPLETED' ORDER BY created_at DESC", [partnerId]));
  const gross = rows.reduce((s, b) => s + b.items_total, 0);
  const commission = rows.reduce((s, b) => s + b.commission, 0);
  return { rows, gross, commission, net: gross - commission };
}
