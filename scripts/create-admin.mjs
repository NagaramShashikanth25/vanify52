/**
 * Creates a staff (ADMIN) login, or promotes an existing account to staff.
 *
 *   DATABASE_URL="postgres://…" npm run create-admin
 *
 * Asks for the mobile number, name and password. The password is not shown as
 * you type and is stored only as a bcrypt hash. Without DATABASE_URL it works on
 * the local PGlite database.
 */
import bcrypt from "bcryptjs";
import path from "node:path";
import readline from "node:readline";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_ = process.env.DATABASE_URL;

// One reader for every visible question, so piped answers are not lost between them.
const rl = readline.createInterface({ input: process.stdin });
const lines = rl[Symbol.asyncIterator]();
async function ask(question) {
  process.stdout.write(question);
  const { value } = await lines.next();
  return String(value || "").trim();
}

async function askHidden(question) {
  if (process.env.ADMIN_PASSWORD) { rl.close(); return process.env.ADMIN_PASSWORD; }
  if (!process.stdin.isTTY) { const v = await ask(question); rl.close(); return v; }
  rl.close();
  // Switch echo off BEFORE showing the prompt, so nothing typed can appear.
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  process.stdout.write(question);
  let value = "";
  return new Promise((res) => {
    const onData = (buf) => {
      for (const ch of String(buf)) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData);
          process.stdout.write("\n");
          return res(value);
        }
        if (ch === "\u0003") { process.stdout.write("\n"); process.exit(1); }   // Ctrl-C
        if (ch === "\u007f" || ch === "\b") { value = value.slice(0, -1); continue; }
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function connect() {
  if (URL_) {
    const { default: pg } = await import("pg");
    const local = /localhost|127\.0\.0\.1/.test(URL_);
    const client = new pg.Client({
      connectionString: URL_,
      ssl: local ? false : { rejectUnauthorized: process.env.PGSSL_NO_VERIFY !== "1" },
    });
    await client.connect();
    return { q: (s, p) => client.query(s, p), close: () => client.end(), where: "DATABASE_URL" };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await PGlite.create(path.join(root, "db", "local"));
  return { q: (s, p) => db.query(s, p), close: () => db.close(), where: "db/local (PGlite)" };
}

const phone = (await ask("Staff mobile number (10 digits): ")).replace(/\D/g, "").slice(-10);
if (!/^\d{10}$/.test(phone)) { console.error("That is not a 10-digit number."); process.exit(1); }
const name = (await ask("Name: ")) || "Ops Admin";
const password = await askHidden("Password (12+ characters): ");
if (password.length < 12) { console.error("Use at least 12 characters for a staff password."); process.exit(1); }
if (password.length > 72) { console.error("Keep it under 72 characters."); process.exit(1); }
if (password === "password123") { console.error("Not the demo password."); process.exit(1); }

const db = await connect();
const hash = bcrypt.hashSync(password, 10);
const { rows } = await db.q("SELECT id, role FROM users WHERE phone = $1", [phone]);

if (rows.length) {
  await db.q("UPDATE users SET role = 'ADMIN', password_hash = $1, name = $2 WHERE id = $3", [hash, name, rows[0].id]);
  console.log(`\nUpdated ${phone} in ${db.where}: now staff (was ${rows[0].role}), with the new password.`);
} else {
  const id = "u_" + randomUUID().replace(/-/g, "").slice(0, 18);
  await db.q("INSERT INTO users (id, name, phone, password_hash, role) VALUES ($1,$2,$3,$4,'ADMIN')", [id, name, phone, hash]);
  console.log(`\nCreated staff login ${phone} in ${db.where}. Sign in at /login, then open /admin.`);
}
await db.close();
