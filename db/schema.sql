-- Vanify schema (PostgreSQL).
-- Runs on Neon / Vercel Postgres / any Postgres 14+, and on PGlite for local dev.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT UNIQUE,                      -- null until a Google user adds one
  email         TEXT UNIQUE,
  password_hash TEXT,                             -- null for Google-only accounts
  google_id     TEXT UNIQUE,
  avatar        TEXT,
  role          TEXT NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER | PARTNER | ADMIN
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_has_a_login CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS partners (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skills     TEXT NOT NULL,                       -- csv of category ids
  zones      TEXT NOT NULL,                       -- csv of service areas
  status     TEXT NOT NULL DEFAULT 'PENDING',     -- PENDING | APPROVED | SUSPENDED
  online     BOOLEAN NOT NULL DEFAULT false,
  rating     REAL NOT NULL DEFAULT 0,
  jobs_done  INTEGER NOT NULL DEFAULT 0,
  id_proof   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label   TEXT NOT NULL DEFAULT 'Home',
  zone    TEXT NOT NULL,
  line    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  blurb TEXT NOT NULL,
  icon  TEXT NOT NULL,
  sort  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  detail      TEXT NOT NULL,
  price       INTEGER NOT NULL,
  minutes     INTEGER NOT NULL DEFAULT 60,
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id          TEXT PRIMARY KEY,
  ref         TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES users(id),
  partner_id  TEXT REFERENCES partners(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  zone        TEXT NOT NULL,
  address     TEXT NOT NULL,
  note        TEXT,
  day         TEXT NOT NULL,
  slot        TEXT NOT NULL,
  items_total INTEGER NOT NULL,
  fee         INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'SEARCHING',
  otp         TEXT NOT NULL,
  commission  INTEGER NOT NULL DEFAULT 0,
  rating      INTEGER,
  review      TEXT,
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_items (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id),
  name       TEXT NOT NULL,
  price      INTEGER NOT NULL,
  qty        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS booking_events (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issues (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner  ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
