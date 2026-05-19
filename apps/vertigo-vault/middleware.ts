import { NextRequest, NextResponse } from "next/server";

/**
 * CSP middleware — generates a per-request nonce and sets the
 * Content-Security-Policy header. Next.js reads the nonce from the
 * `x-nonce` request header and automatically applies it to inline
 * hydration scripts.
 *
 * Using `'strict-dynamic'` (CSP Level 3):
 *   - Nonced scripts can dynamically load other scripts (covers Next.js chunks)
 *   - Source expressions like `'self'` and URL allowlists serve as CSP Level 2 fallbacks
 *   - `'unsafe-inline'` is no longer needed in script-src
 *
 * Why `middleware.ts` and not `proxy.ts`: Next.js 16's `proxy.ts`
 * compiles to a Node.js function, which OpenNext on CF Workers rejects
 * ("Node.js middleware is not currently supported"). `middleware.ts`
 * compiles to Edge runtime, which OpenNext-CF accepts. See
 * docs/research/middleware-vs-proxy-nextjs16-opennext.md for the
 * source-code-verified rationale. Rule for all CF-deployed apps in
 * this repo: always use middleware.ts, never proxy.ts.
 */
export function middleware(request: NextRequest) {
  // btoa instead of Buffer — middleware runs on the Edge runtime under
  // OpenNext-CF, where Web crypto and atob/btoa are guaranteed but
  // Buffer is not.
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    /**
     * Two entries because path-to-regexp's `(?:\/(...))` capture for the
     * negative-lookahead path is non-optional — it requires at least one
     * character after the basePath slash, so a bare `/harbour/vertigo-vault`
     * (the home route) silently skips the middleware. Adding the root
     * matcher first ensures the home page also gets the nonce-CSP.
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
