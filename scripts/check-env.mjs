/**
 * Runs before `next build`. On a hosted build (Vercel, CI) it fails loudly when
 * a required variable is missing — a failed deploy you can read is better than
 * a deployed site that 500s on every page.
 * Local builds are not blocked.
 */
const hosted = process.env.VERCEL || process.env.CI;
if (!hosted) process.exit(0);

const problems = [];
const secret = process.env.AUTH_SECRET || "";

if (!secret) problems.push("AUTH_SECRET is not set.");
else if (secret.length < 32 || secret === "change-this-to-a-long-random-string") {
  problems.push("AUTH_SECRET is too short or still the placeholder (needs 32+ random characters).");
}
if (!process.env.DATABASE_URL) {
  problems.push("DATABASE_URL is not set. A serverless host cannot use the local database.");
}
const id = process.env.GOOGLE_CLIENT_ID, secretG = process.env.GOOGLE_CLIENT_SECRET;
if (Boolean(id) !== Boolean(secretG)) {
  problems.push("Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither.");
}

if (problems.length) {
  console.error("\n  Deployment is missing some configuration:\n");
  for (const p of problems) console.error("   • " + p);
  console.error(`
  Add them under Settings → Environment Variables, then redeploy.
  Generate a secret with:
    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
`);
  process.exit(1);
}
console.log("Environment looks complete.");
