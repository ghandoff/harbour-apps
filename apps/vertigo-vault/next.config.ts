import type { NextConfig } from "next";

/**
 * Vault Next.js config.
 *
 * Note: the `headers()` block was removed during the CF Workers
 * migration (2026-05). OpenNext on CF does NOT honour Next.js's
 * `next.config.ts` `headers()` at runtime. Static security headers
 * (HSTS, X-Frame-Options, etc.) are injected by `worker.ts` via
 * `@windedvertigo/security`. Per-request CSP with a nonce continues
 * to be set in `middleware.ts`.
 */
const nextConfig: NextConfig = {
  basePath: "/harbour/vertigo-vault",
  poweredByHeader: false,
  transpilePackages: [
    "@windedvertigo/tokens",
    "@windedvertigo/auth",
    "@windedvertigo/stripe",
    "@windedvertigo/feedback",
  ],
};

export default nextConfig;
