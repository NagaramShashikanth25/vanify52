/**
 * Creates the schema and loads demo data.
 *
 *   npm run setup                          → local PGlite database in db/local
 *   DATABASE_URL=postgres://… npm run setup → your Neon / Vercel Postgres database
 *
 * Pass --force to drop the existing tables first.
 */
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");
const URL_ = process.env.DATABASE_URL;

function sslSetting(url) {
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  if (process.env.PGSSL_NO_VERIFY === "1") return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
}

async function connect() {
  if (URL_) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({
      connectionString: URL_,
      ssl: sslSetting(URL_),
    });
    await client.connect();
    return {
      q: (sql, p = []) => client.query(sql, p),
      exec: (sql) => client.query(sql),               // pg runs multi-statement SQL as-is
      close: () => client.end(),
      where: "DATABASE_URL",
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(root, "db", "local");

  // A reset of the local database is simply a fresh directory. This also clears
  // the lock file (and any half-written state) left behind by a killed process.
  if (force && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  const lock = path.join(dir, "postmaster.pid");
  if (fs.existsSync(lock)) fs.rmSync(lock, { force: true });

  const db = await PGlite.create(dir);
  return {
    q: (sql, p = []) => db.query(sql, p),
    exec: (sql) => db.exec(sql),                      // PGlite needs exec() for a script
    close: () => db.close(),
    where: "db/local (PGlite)",
  };
}

const TABLES = ["booking_events", "issues", "booking_items", "bookings", "addresses", "partners", "users", "services", "categories"];

const CATEGORIES = [
  ["cleaning", "Cleaning & housekeeping", "Deep cleans, bathrooms, sofas and kitchens.", "spray"],
  ["electrical", "Electrical work", "Fans, switchboards, lights and inverters.", "bolt"],
  ["plumbing", "Plumbing", "Taps, blockages, tanks and motors.", "pipe"],
  ["carpentry", "Carpentry & repairs", "Doors, hinges, furniture and fittings.", "hammer"],
  ["painting", "Painting", "Single walls, rooms and touch-ups.", "roller"],
  ["moving", "Movers & delivery help", "Tempo, loading, unloading and shifting.", "van"],
  ["events", "Event helpers", "Serving staff, setup crew and after-clean.", "tray"],
  ["tutoring", "Tutors & home support", "Home tuition and elder-care attendants.", "book"],
  ["labour", "Daily-wage labour", "General helpers and site labour by the day.", "helmet"],
];

const SERVICES = [
  ["cleaning", "Full home deep clean (2 BHK)", "Team of two, about five hours", 2499, 300],
  ["cleaning", "Kitchen deep clean", "Chimney exterior, slabs, cabinets", 1199, 150],
  ["cleaning", "Bathroom deep clean", "One bathroom, machine scrub", 549, 90],
  ["cleaning", "Sofa cleaning (per seat)", "Wet shampoo and vacuum", 249, 30],
  ["electrical", "Inverter servicing", "Battery check, terminal cleaning", 399, 60],
  ["electrical", "Fan repair or replacement", "Per fan, excludes parts", 199, 45],
  ["electrical", "Switchboard or socket fix", "Per board", 149, 40],
  ["electrical", "Light or chandelier fitting", "Per fitting, ladder work included", 129, 40],
  ["plumbing", "Drain blockage removal", "Sink, basin or bathroom drain", 399, 60],
  ["plumbing", "Water motor check", "Priming, wiring and pressure test", 349, 60],
  ["plumbing", "Flush tank repair", "Washer and valve work", 299, 50],
  ["plumbing", "Tap or mixer repair", "Per tap, excludes parts", 149, 40],
  ["carpentry", "Furniture assembly", "Per unit, flat-pack or modular", 399, 90],
  ["carpentry", "Door repair or alignment", "Per door, hinges included", 249, 60],
  ["carpentry", "Curtain rod installation", "Per rod, drilling included", 199, 45],
  ["carpentry", "Drawer or hinge fix", "Up to three fittings", 149, 45],
  ["painting", "Single wall painting", "Up to 120 sq ft, labour only", 899, 180],
  ["painting", "Patch and touch-up", "Up to four patches", 499, 120],
  ["painting", "Full home painting survey", "Measurement visit, quote in 24 hours", 0, 45],
  ["moving", "Tempo with two helpers", "Up to 10 km within the city", 1899, 240],
  ["moving", "Loading and unloading help", "Two helpers, two hours", 699, 120],
  ["moving", "Single-item shifting", "Fridge, washing machine or almirah", 399, 90],
  ["events", "After-event cleaning crew", "Team of three, up to three hours", 1299, 180],
  ["events", "Serving staff (6 hours)", "Per person, uniform provided", 999, 360],
  ["events", "Setup and arrangement helper", "Per person, four hours", 799, 240],
  ["tutoring", "Elder care attendant", "Four-hour shift, non-medical support", 899, 240],
  ["tutoring", "Home tuition (1 hour)", "Classes 1–10, all subjects", 350, 60],
  ["labour", "Site labour (8 hours)", "Construction or renovation site", 799, 480],
  ["labour", "General helper (8 hours)", "Lifting, shifting, clearing", 749, 480],
];

const PARTNERS = [
  ["Ramesh Kumar", "9876500001", "electrical", "Kukatpally,Miyapur", "APPROVED", 4.8, 214],
  ["Sunitha Bai", "9876500002", "cleaning", "Madhapur,Kondapur", "APPROVED", 4.9, 388],
  ["Naveen Reddy", "9876500003", "plumbing", "Kukatpally,Ameerpet", "APPROVED", 4.6, 156],
  ["Imran Shaikh", "9876500004", "moving,labour", "Gachibowli,Madhapur", "APPROVED", 4.7, 92],
  ["Anitha Goud", "9876500005", "events,cleaning", "Kondapur", "PENDING", 0, 0],
];

import { randomUUID } from "node:crypto";
const uid = (p) => p + randomUUID().replace(/-/g, "").slice(0, 18);

// Generate a signing secret on first run so nobody has to remember to.
const envFile = path.join(root, ".env.local");
if (!fs.existsSync(envFile)) {
  const { randomBytes } = await import("node:crypto");
  fs.writeFileSync(envFile,
    `# Created by npm run setup. Keep this file out of git.\n` +
    `AUTH_SECRET="${randomBytes(48).toString("hex")}"\n`);
  console.log("Created .env.local with a fresh AUTH_SECRET.");
}

const db = await connect();
console.log(`Setting up ${db.where}…`);

if (force) {
  for (const t of TABLES) await db.q(`DROP TABLE IF EXISTS ${t} CASCADE`);
}

await db.exec(fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8"));

const { rows: existing } = await db.q("SELECT COUNT(*)::int AS n FROM categories");
if (existing[0].n > 0 && !force) {
  console.log("Data is already there. Use `npm run db:reset` to rebuild it.");
  await db.close();
  process.exit(0);
}

for (const [i, [id, name, blurb, icon]] of CATEGORIES.entries()) {
  await db.q("INSERT INTO categories (id,name,blurb,icon,sort) VALUES ($1,$2,$3,$4,$5)", [id, name, blurb, icon, i]);
}

const serviceIds = {};
for (const [cat, name, detail, price, minutes] of SERVICES) {
  const id = uid("s_");
  serviceIds[name] = id;
  await db.q("INSERT INTO services (id,category_id,name,detail,price,minutes) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, cat, name, detail, price, minutes]);
}

const pw = bcrypt.hashSync("password123", 10);
async function mkUser(name, phone, role, email) {
  const id = uid("u_");
  await db.q("INSERT INTO users (id,name,phone,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, name, phone, email ?? null, pw, role]);
  return id;
}

await mkUser("Ops Admin", "9000000000", "ADMIN", "ops@vanify.in");
const customerId = await mkUser("Dinesh N.", "9999900000", "CUSTOMER", "customer@vanify.in");
await db.q("INSERT INTO addresses (id,user_id,label,zone,line) VALUES ($1,$2,$3,$4,$5)",
  [uid("ad_"), customerId, "Home", "Kukatpally", "Flat 402, Sai Residency, Road No. 4"]);

const partnerIds = {};
for (const [name, phone, skills, zones, status, rating, jobs] of PARTNERS) {
  const userId = await mkUser(name, phone, "PARTNER");
  const id = uid("p_");
  partnerIds[name] = id;
  await db.q("INSERT INTO partners (id,user_id,skills,zones,status,online,rating,jobs_done) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [id, userId, skills, zones, status, status === "APPROVED", rating, jobs]);
}

// A completed job: customer history and a partner earnings row.
const b1 = uid("b_");
await db.q(
  `INSERT INTO bookings (id,ref,customer_id,partner_id,category_id,zone,address,day,slot,items_total,fee,status,otp,commission,rating,paid_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())`,
  [b1, "VN730114", customerId, partnerIds["Sunitha Bai"], "cleaning", "Madhapur",
   "Flat 402, Sai Residency, Road No. 4", "Yesterday", "11:00 AM – 12:00 PM", 1098, 19, "COMPLETED", "4417", 132, 5]);
await db.q("INSERT INTO booking_items (id,booking_id,service_id,name,price,qty) VALUES ($1,$2,$3,$4,$5,$6)",
  [uid("bi_"), b1, serviceIds["Bathroom deep clean"], "Bathroom deep clean", 549, 2]);
for (const label of ["Booking placed", "Sunitha Bai accepted the job", "Job completed"]) {
  await db.q("INSERT INTO booking_events (id,booking_id,label) VALUES ($1,$2,$3)", [uid("ev_"), b1, label]);
}

// A live request waiting for an electrician in Miyapur (Ramesh covers that area).
const b2 = uid("b_");
await db.q(
  `INSERT INTO bookings (id,ref,customer_id,category_id,zone,address,day,slot,items_total,fee,status,otp)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
  [b2, "VN730118", customerId, "electrical", "Miyapur", "H.No 7-2-19, Bhagyanagar Colony",
   "Today", "4:00 PM – 5:00 PM", 597, 19, "SEARCHING", "8290"]);
await db.q("INSERT INTO booking_items (id,booking_id,service_id,name,price,qty) VALUES ($1,$2,$3,$4,$5,$6)",
  [uid("bi_"), b2, serviceIds["Fan repair or replacement"], "Fan repair or replacement", 199, 3]);
await db.q("INSERT INTO booking_events (id,booking_id,label) VALUES ($1,$2,$3)", [uid("ev_"), b2, "Booking placed"]);

await db.close();
console.log(`Ready.

  Customer    9999900000 / password123
  Partner     9876500001 / password123   (Ramesh — electrical, Kukatpally + Miyapur)
  Partner     9876500002 / password123   (Sunitha — cleaning, Madhapur + Kondapur)
  Admin       9000000000 / password123
`);
