/**
 * Edge middleware — route protection and CSRF for CF Workers deployment.
 *
 * Runs on the edge runtime (required by OpenNext/CF Workers). Handles:
 *   - Route protection: redirects unauthenticated users to /login
 *   - CSRF validation: rejects cross-origin state-changing requests
 *
 * Rate limiting (Postgres-backed) lives in proxy-handler.ts for Node.js
 * contexts only — CF's built-in WAF handles layer-3/4 rate limiting.
 *
 * Public routes: /, /find/*, /matcher/*, /play/*, /log/*, /community/*,
 *   /gallery/*, /sampler/*, /browse, /packs (catalogue only), /login,
 *   /onboarding, /api/auth/*, /api/cron/*, /api/matcher/*
 * Protected routes: /packs/[slug]/*, /runs/*, /admin/*, /api/admin/*,
 *   /profile/*
 */

import { NextRequest, NextResponse } from "next/server";

// Temporary no-op — stripping all logic to isolate the 1101 crash.
// Route protection and CSRF will be restored once the crash is confirmed fixed.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
