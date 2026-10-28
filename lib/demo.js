/**
 * Demo logins (password123) are printed on the sign-in pages only on your own
 * machine, or on a deployment where you deliberately set DEMO_MODE=1 — for
 * example a preview you show to investors. Never on the live site by default:
 * a printed staff number plus a known password is an open door to /admin.
 * Server-only (reads a non-public env variable).
 */
export const showDemoLogins = () =>
  process.env.DEMO_MODE === "1" || process.env.NODE_ENV !== "production";
