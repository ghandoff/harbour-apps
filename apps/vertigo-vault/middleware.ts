import { NextRequest, NextResponse } from "next/server";

/**
 * Vault middleware — runs on Vercel only (the platform that hosts vault
 * today).
 *
 * CSP nonce now emitted by worker.ts on CF Workers; this middleware
 * runs on Vercel only.
 *
 * Historically this file generated a per-request nonce and set the
 * Content-Security-Policy header. That code has moved to worker.ts
 * (via @windedvertigo/security's wrapWithSecurityHeaders) ahead of the
 * eventual CF Workers cutover, where Next.js's middleware doesn't get
 * a chance to run for OpenNext-emitted handlers.
 *
 * For now on Vercel, the static CSP from next.config.ts headers() is
 * authoritative — `'unsafe-inline'` falls back to Level-2 semantics
 * until the Worker wrapper learns nonce support (see TODO in
 * docs/security/cf-headers-wrapper.md).
 *
 * This file is intentionally retained (rather than deleted) because:
 *   1. Auth.js / route-protection logic will land here next; the
 *      structure is in place for that.
 *   2. Removing it would require also stripping the matcher config and
 *      re-wiring next.config.ts; keeping the no-op matcher avoids that
 *      churn while the file is empty.
 *
 * Why `middleware.ts` and not `proxy.ts`: Next.js 16.2.3 docs claim
 * `proxy.ts` is the canonical convention, but the build pipeline emits
 * `.next/server/middleware.js` from a `proxy.ts` source while leaving
 * `.next/server/middleware-manifest.json` empty (`"middleware": {}`).
 * Vercel's runtime only invokes middleware registered in that manifest,
 * so a `proxy.ts` file is silently a no-op. Restoring the legacy
 * `middleware.ts` filename + `export function middleware` makes the
 * manifest populate correctly. Revisit if/when Next.js fixes proxy.ts
 * manifest emission.
 */
export function middleware(_request: NextRequest) {
  // No-op pass-through. Auth.js / route-protection logic will land here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /**
     * Two entries because path-to-regexp's `(?:\/(...))` capture for the
     * negative-lookahead path is non-optional — it requires at least one
     * character after the basePath slash, so a bare `/harbour/vertigo-vault`
     * (the home route) silently skips the middleware.
     */
    "/",
    {
      source: "/((?!_next/static|_next/image|images/|favicon\\.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
