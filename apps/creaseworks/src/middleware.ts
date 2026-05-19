/**
 * Next.js Edge middleware for creaseworks.
 *
 * IMPORTANT — OpenNext CF caveat: Next.js 16 introduced proxy.ts as a
 * replacement for middleware.ts, but proxy.ts compiles to a Node.js function
 * which OpenNext CF does NOT support (only Edge runtime is accepted).
 * middleware.ts still compiles to Edge runtime and IS accepted by OpenNext CF.
 * → For OpenNext CF apps, always use middleware.ts, not proxy.ts.
 *
 * Full route protection (JWT auth, Postgres rate limiting, CSRF) lives in
 * proxy-handler.ts but cannot run at the Edge layer. Those features are
 * implemented at the CF Worker wrapper level (worker.ts) instead.
 *
 * This file is intentionally minimal — a pass-through. The CF Worker wrapper
 * handles security headers via @windedvertigo/security.
 */
import { NextRequest, NextResponse } from "next/server";

export function middleware(_req: NextRequest): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
