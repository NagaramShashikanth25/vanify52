# Vanify

An on-demand platform that connects people to verified temporary workers — cleaning,
electrical, plumbing, carpentry, painting, moving, events, tutoring and daily-wage labour.

Three surfaces share one database, and each sees only what it should:

| Surface | Route | Who signs in | What they see |
|---|---|---|---|
| Customer app | `/` | Customers | Services, prices, their own bookings, the professional assigned to them |
| Partner app | `/partner` | Professionals | Requests for their trades and areas, their own earnings |
| Ops console | `/admin` | Staff | Every booking, commission and revenue, approvals, issues |

Commission, revenue and approvals never appear on the customer side. A professional sees
only the service, area and slot of an open request — the full address and phone number are
released after they accept it.

---

## 1. Running it on your machine

Needs **Node 22** (the version this code is tested on, and the one pinned for Vercel).
Nothing else to install — no database server, no Docker.

```bash
node -v      # should print v22.x
```

```bash
npm install
npm run setup     # creates the database, demo data and .env.local
npm run dev       # http://localhost:3000
```

**If something goes wrong, run `npm run doctor`.** It checks your Node version, the
dependencies, the signing secret and the database, and prints the exact command to fix
whatever is missing.

With `DATABASE_URL` unset, the app runs on **PGlite** — real Postgres compiled to
WebAssembly, stored in `db/local/`. It is the same SQL production runs.

### Demo accounts — password `password123` (local only)

These are created on your machine. They are **not** created on a hosted database unless you
ask for them with `--demo`, and the sign-in page only lists them in development or when
the deployment sets `DEMO_MODE=1`.

| Role | Mobile |
|---|---|
| Customer | 9999900000 |
| Professional | 9876500001 (Ramesh — electrical, Kukatpally + Miyapur) |
| Professional | 9876500002 (Sunitha — cleaning, Madhapur + Kondapur) |
| Staff | 9000000000 |

`npm run db:reset` rebuilds the local database from scratch. That is also the fix if the
database ever refuses to open after a crash.

### Seeing the whole loop

1. Sign in as the customer, add **Fan repair** in **Kukatpally**, pick a slot, confirm.
2. In a private window, sign in as 9876500001. The request is waiting — accept it; the
   address appears only now.
3. Read the four-digit **start code** on the customer's booking page.
4. Partner side: *Enter start code* → *Mark job complete*, then open **Earnings**.
5. Staff at `/admin`: the commission on that job, and approve the pending professional.

### Common problems

| What you see | What it means |
|---|---|
| `The database has no tables yet` | Run `npm run setup` |
| `Could not open the local database in db/local` | Another `npm run dev` is still running, or a crash left a lock. Stop it, or run `npm run db:reset` |
| `AUTH_SECRET is missing or too short` | Run `npm run setup`, which writes `.env.local` |
| `EADDRINUSE :3000` | Something else is on port 3000. `npm run dev -- -p 3001` |
| Fonts look plain | The two Google fonts load over the network; offline it falls back to system fonts |

---

## 2. Deploying to Vercel

SQLite could not come along — Vercel's filesystem is read-only and every request may land
on a different instance. The app runs on Postgres there.

**Step 1 — create the database in Singapore.** Vercel dashboard → *Storage* → *Create* →
**Neon Postgres**, region **AWS Asia Pacific (Singapore)**. Vercel sets `DATABASE_URL` for
you. With an outside provider, copy the **pooled** connection string in yourself.

`vercel.json` runs the app's functions in Singapore (`sin1`) so they sit next to the
database. Neon has no Mumbai region; Singapore is the closest to Hyderabad. If you pick
another database region, change `regions` in `vercel.json` to match — a function far
from its database pays the distance on every query.

**Step 2 — set the variables** under *Settings → Environment Variables*:

| Variable | Required | Value |
|---|---|---|
| `AUTH_SECRET` | yes | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DATABASE_URL` | yes | The pooled connection string |
| `APP_URL` | recommended | Your public address, e.g. `https://vanify.in` or `https://vanify.vercel.app` |
| `DEMO_MODE` | no | `1` only on a demo deployment that should list the demo logins |

**Step 3 — create the tables and your staff login.** Once, from your machine:

```bash
DATABASE_URL="postgres://…" npm run setup          # tables + service catalogue, no demo accounts
DATABASE_URL="postgres://…" npm run create-admin   # asks for number, name, password (hidden)
```

`npm run db:reset` refuses to drop a hosted database unless you add
`--yes-drop-hosted-data`, so a stray `DATABASE_URL` in your terminal cannot wipe it.

**Step 4 — push the repo and import it on Vercel.** It detects Next.js; no build settings
to change.

### Will the build fail?

The build does not touch the database, so a missing or wrong `DATABASE_URL` cannot break
compilation — but it would break every page at runtime. To make that obvious early,
`npm run build` runs `scripts/check-env.mjs` first, which **fails the deploy with a plain
message** if `AUTH_SECRET` or `DATABASE_URL` is missing on a hosted build. A failed deploy
you can read beats a deployed site that 500s.

Local builds are never blocked by that check.

If you ever seeded a hosted database with `--demo`, delete those accounts before real
traffic — they share a known password:

```sql
DELETE FROM users WHERE phone IN
  ('9999900000','9876500001','9876500002','9876500003','9876500004','9876500005','9000000000');
```

Then run `npm run create-admin` for your own staff login.

---

## 3. Google sign-in — later, when you want it

**Nothing to do for launch.** With `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` unset, the
Google buttons do not render anywhere and mobile + password sign-in is the only route. The
code sits dormant.

When you are ready:

1. [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   → *Create credentials* → *OAuth client ID* → *Web application*.
2. Authorised redirect URIs, exactly:
   ```
   http://localhost:3000/api/auth/google/callback
   https://your-domain.com/api/auth/google/callback
   ```
3. Add the two variables in Vercel and redeploy. The buttons appear by themselves.

Set `APP_URL` to your public address as well; the callback is built from it (or, if
unset, from the address the visitor is on). Google sign-in only works on addresses you
registered, so it will not work on Vercel preview URLs — that is expected.

Only `openid`, `email` and `profile` are requested, so Google does not require app
verification. A Google account carries no phone number, so a new Google user is sent to
`/onboarding` to add one before they can book.

A Google sign-in is **never attached to an existing password account just because the
emails match.** Sign-up emails are not verified, so automatic linking would let someone
register with another person's email and later receive that person's Google sign-in. That
person is told to sign in with their mobile number instead. A safe "Connect Google" button
inside a signed-in account can be added later.

---

## Security

`npm audit` reports **0 vulnerabilities**. Keep it that way: run `npm audit` before each
deploy, and prefer `npm update` over `npm audit fix --force` — the `--force` flag installs
major versions, which is how a working build turns into a broken one in a single command.

What is enforced in the code:

- **Passwords** hashed with bcrypt (cost 10). Login replies the same way for a wrong
  number and a wrong password, so the form cannot be used to discover who has an account.
- **Sessions** are signed JWTs in an httpOnly, SameSite=Lax, Secure cookie. In production
  the app refuses to start with a missing or placeholder `AUTH_SECRET`, because a known
  secret lets anyone forge an admin session.
- **Role checks twice**: `proxy.js` blocks a protected route before the page renders, and
  every API route and private page re-checks the role server-side. Ownership is checked per record —
  a booking only opens for its own customer, a job action only for its assigned professional.
- **Prices come from the database**, never from the browser, so editing the cart in
  devtools cannot change what is charged.
- **Every statement is parameterised** (`$1`, `$2`), so there is no SQL injection surface.
  React escapes all rendered values, so there is no reflected XSS.
- **No open redirects**: `?next=` is accepted only when it is a path on this site. An
  absolute or protocol-relative URL falls back to a safe default.
- **CSRF**: SameSite=Lax cookies plus an Origin check on every mutating endpoint.
- **Brute force**: login is capped at 5 attempts per number and 20 per address per
  15 minutes; the four-digit start code is capped at 5 attempts per job.
- **Unguessable identifiers**: row ids, booking references and start codes come from the
  CSPRNG, not `Math.random`.
- **TLS to the database is verified** (`rejectUnauthorized: true`).
- **Headers**: Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`,
  Referrer-Policy, Permissions-Policy, HSTS. The framework version is not advertised.

What is still open, and should be closed before money moves:

1. **Phone numbers are unverified.** Add an OTP provider (MSG91, Twilio) at registration
   and in onboarding.
2. **Payments are recorded, not collected.** Add Razorpay or Cashfree and hold the payout
   until the job is marked complete.
3. **Rate limits are per instance** (`lib/guard.js`, in memory). On Vercel each instance
   counts separately. Move the counters to Upstash Redis or Vercel KV — only that file
   changes.
4. **Sessions cannot be revoked** before they expire (30 days). If you need "sign out
   everywhere", store a token version on the user row and check it in `currentUser`.
5. **No identity-document upload.** `partners.id_proof` exists but nothing writes to it.
6. **No audit log** of admin actions.

---

## Tests

```bash
npm run test:unit                       # dates, redirects, Google rules
# end-to-end, against a THROWAWAY local Postgres (the suite rebuilds it):
npm run build
DATABASE_URL=postgres://…@localhost/… npx next start -p 3100 &
DATABASE_URL=postgres://…@localhost/… QUERY_LOG=/path/to/postgres.log npm run test:e2e
```

The end-to-end suite refuses any non-local `DATABASE_URL`. `QUERY_LOG` (a Postgres log
with `log_statement = 'all'`) is only needed for the two query-count checks.

Every job status change is a single conditional `UPDATE` naming the statuses it may start
from, so a cancelled or finished job can never be pushed backwards or completed twice.

## How it is built

- **Next.js 16 (App Router, Turbopack)** — server components query the database directly;
  route handlers under `app/api/*` handle writes. Route guards live in `proxy.js`, which is
  what Next 16 calls the file that used to be `middleware.js`.
- **Postgres** — `pg` in production, PGlite locally, one `query()` adapter, one dialect.
- **CSS** — one hand-written stylesheet on design tokens. No UI framework.

```
app/      pages and API routes
components/  header, footer, cart context, forms, job actions
lib/
  config.js  fee, commission, zones, slots — business rules in one place
  db.js      the query adapter (pg or PGlite)
  repo.js    every SQL statement in the app
  auth.js    hashing, JWT, session helpers
  guard.js   rate limiting
  safe.js    redirect and origin checks
  google.js  OAuth (dormant until configured)
db/schema.sql        tables and indexes
scripts/setup-db.mjs creates + seeds, locally or against DATABASE_URL
scripts/doctor.mjs   diagnoses a broken local setup
scripts/check-env.mjs fails a hosted build with missing configuration
```

Two professionals tapping *Accept* at the same moment cannot both win a job: the accept is
a single conditional `UPDATE … WHERE status = 'SEARCHING' RETURNING id`, so the second one
updates zero rows. Commission is written onto the booking row when the job completes, so
changing the rate later never rewrites history.
