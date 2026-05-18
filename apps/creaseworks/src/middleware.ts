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

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { checkCsrf } from "@/lib/csrf";

const publicPatterns = [
  /^\/$/,
  /^\/sampler(\/.*)?$/,
  /^\/browse\/?$/,
  /^\/find(\/.*)?$/,
  /^\/matcher(\/.*)?$/,
  /^\/play(\/.*)?$/,
  /^\/log(\/.*)?$/,
  /^\/community(\/.*)?$/,
  /^\/gallery(\/.*)?$/,
  /^\/packs\/?$/,
  /^\/login$/,
  /^\/onboarding$/,
  /^\/api\/auth(\/.*)?$/,
  /^\/api\/cron(\/.*)?$/,
  /^\/api\/matcher(\/.*)?$/,
  /^\/api\/stripe\/webhook$/,
  /^\/api\/webhooks\/notion$/,
  /^\/api\/team\/domains\/verify$/,
  /^\/checkout\/success$/,
  /^\/_next(\/.*)?$/,
  /^\/favicon\.ico$/,
  /^\/images(\/.*)?$/,
  /^\/icons(\/.*)?$/,
  /^\/manifest\.json$/,
];

function isPublicRoute(pathname: string): boolean {
  return publicPatterns.some((p) => p.test(pathname));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF protection — header-based, no Postgres, edge-safe
  const csrfRejection = checkCsrf(req);
  if (csrfRejection) return csrfRejection;

  // Allow public routes without auth check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // JWT verification — reads the shared session cookie
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: "authjs.session-token",
  });

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
