/**
 * Checks everything that commonly goes wrong, and says what to do about each.
 *   npm run doctor
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let problems = 0;
const ok = (m) => console.log("  ok    " + m);
const bad = (m, fix) => { problems++; console.log("  FIX   " + m + "\n        → " + fix); };
const note = (m) => console.log("  note  " + m);

// .env.local is read by Next, but not by a plain node script, so load it here.
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

console.log("\nVanify check\n");

// 1. Node
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) ok(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node} is too old for Next 16`, "install Node 20 or 22 from nodejs.org, or run: nvm install 22");

// 2. Dependencies
if (fs.existsSync(path.join(root, "node_modules", "next"))) ok("dependencies installed");
else bad("node_modules is missing", "run: npm install");

// 3. Secret
const secret = process.env.AUTH_SECRET || "";
if (!secret) bad("AUTH_SECRET is not set", "copy .env.example to .env.local");
else if (secret.length < 32 || secret === "change-this-to-a-long-random-string") {
  bad("AUTH_SECRET is still the placeholder",
      `put this in .env.local:\n        AUTH_SECRET="${(await import("node:crypto")).randomBytes(32).toString("hex")}"`);
} else ok("AUTH_SECRET looks fine");

// 4. Database
const url = process.env.DATABASE_URL;
try {
  let q, close;
  if (url) {
    const { default: pg } = await import("pg");
    const c = new pg.Client({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: process.env.PGSSL_NO_VERIFY !== "1" },
    });
    await c.connect();
    q = (s) => c.query(s); close = () => c.end();
    ok("connected to DATABASE_URL");
  } else {
    const dir = path.join(root, "db", "local");
    if (!fs.existsSync(dir)) {
      bad("no local database yet", "run: npm run setup");
    } else {
      const { PGlite } = await import("@electric-sql/pglite");
      const db = await PGlite.create(dir);
      q = (s) => db.query(s); close = () => db.close();
      ok("local PGlite database found (db/local)");
    }
  }
  if (q) {
    const { rows } = await q("SELECT COUNT(*)::int AS n FROM services");
    if (rows[0].n > 0) ok(`${rows[0].n} services loaded`);
    else bad("tables exist but are empty", "run: npm run db:reset");
    const u = await q("SELECT COUNT(*)::int AS n FROM users");
    ok(`${u.rows[0].n} user accounts`);
    await close();
  }
} catch (e) {
  if (e?.code === "42P01") bad("the database has no tables", "run: npm run setup");
  else bad("database error: " + e.message, url ? "check DATABASE_URL" : "run: npm run setup");
}

// 5. Google (optional, step two)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ok("Google sign-in configured");
else note("Google sign-in is off — the buttons stay hidden. That is fine for launch.");

console.log(problems ? `\n${problems} thing(s) to fix above.\n` : "\nAll good. Run: npm run dev\n");
process.exit(problems ? 1 : 0);
