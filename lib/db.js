/**
 * One query interface, two drivers:
 *   • DATABASE_URL set  → node-postgres against Neon / Vercel Postgres / any Postgres
 *   • DATABASE_URL unset → PGlite, real Postgres compiled to WASM, stored in db/local
 *
 * The SQL is identical either way, so local development needs no database server
 * and production is ordinary Postgres.
 */
import path from "node:path";

const g = globalThis;
const URL_ = process.env.DATABASE_URL;

/**
 * Verify the database server's certificate. Turning verification off would let
 * anyone between the app and the database read every row in transit. Managed
 * providers (Neon, Supabase, Vercel Postgres) all present valid certificates.
 * Set PGSSL_NO_VERIFY=1 only for a self-signed server you control.
 */
function sslSetting(url) {
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  if (process.env.PGSSL_NO_VERIFY === "1") return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
}

async function connect() {
  // On a serverless host the filesystem is read-only and every request may hit a
  // different instance, so the local database cannot work there. Running a
  // production build on your own machine is fine.
  const serverless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!URL_ && serverless) {
    throw new Error(
      "DATABASE_URL is not set. This host needs a Postgres connection string — " +
      "add one under Settings → Environment Variables, then redeploy."
    );
  }
  if (!URL_ && process.env.NODE_ENV === "production") {
    console.warn("[vanify] No DATABASE_URL — using the local PGlite database in db/local.");
  }
  if (URL_) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: URL_,
      ssl: sslSetting(URL_),
      max: Number(process.env.PG_POOL_MAX || 5),
    });
    return { kind: "pg", query: (text, params) => pool.query(text, params) };
  }

  const pg = await openLocal(path.join(process.cwd(), "db", "local"));
  return { kind: "pglite", query: (text, params) => pg.query(text, params) };
}


/**
 * PGlite leaves a postmaster.pid behind if the process is killed rather than
 * stopped. It is a single in-process database, so a leftover file from a dead
 * run is just stale state — clear it and try once more before giving up.
 */
async function openLocal(dir) {
  const fs = await import("node:fs");
  const { PGlite } = await import("@electric-sql/pglite");
  try {
    return await PGlite.create(dir);
  } catch (err) {
    const lock = path.join(dir, "postmaster.pid");
    if (fs.existsSync(lock)) {
      fs.rmSync(lock, { force: true });
      try {
        return await PGlite.create(dir);
      } catch {}
    }
    throw new Error(
      "Could not open the local database in db/local. Close any other `npm run dev` " +
      "or `npm run setup` still running, then try again. If it keeps failing, " +
      "run `npm run db:reset` to rebuild it. (" + err.message + ")"
    );
  }
}

/** Reused across hot reloads and serverless invocations on the same instance. */
function client() {
  if (!g.__vanifyDb) {
    g.__vanifyDb = connect().catch((err) => {
      g.__vanifyDb = null;        // let the next request try again
      throw err;
    });
  }
  return g.__vanifyDb;
}

export async function query(sql, params = []) {
  const db = await client();
  try {
    return await db.query(sql, params);
  } catch (err) {
    // The two mistakes that actually happen on a first deploy, named plainly
    // instead of surfacing a raw driver error.
    if (err?.code === "42P01") {
      throw new Error(
        "The database has no tables yet. Run `npm run setup` " +
        "(with DATABASE_URL set, if you are pointing at a hosted database)."
      );
    }
    if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND") {
      throw new Error("Cannot reach the database. Check DATABASE_URL.");
    }
    throw err;
  }
}

export const all = async (sql, params = []) => (await query(sql, params)).rows;
export const one = async (sql, params = []) => (await query(sql, params)).rows[0] ?? null;
export const run = async (sql, params = []) => { await query(sql, params); };

export { uid } from "./ids";

/** Builds $1,$2,… for an IN list. */
export const placeholders = (arr, start = 1) => arr.map((_, i) => `$${i + start}`).join(",");
