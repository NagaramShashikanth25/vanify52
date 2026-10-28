/** @type {import('next').NextConfig} */

// Sent on every response. These are the headers a security scan looks for.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },                       // no clickjacking
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects a small inline bootstrap script.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com",     // Google profile pictures
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://accounts.google.com",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,            // stop advertising the framework version
  // Both database drivers load native/WASM files at runtime and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // PGlite (23 MB of WASM) is only for local development. Deployed functions always
  // use DATABASE_URL, so leave it out of them: smaller functions start faster.
  outputFileTracingExcludes: {
    "/**": ["node_modules/@electric-sql/pglite/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
