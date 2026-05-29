/**
 * Shared cookie config for harbour SSO.
 *
 * All harbour apps set cookies on `.windedvertigo.com` with path=/
 * so signing in on any app authenticates you on all others.
 * The cookie names are identical across apps — the JWT is signed
 * with the same AUTH_SECRET.
 *
 * We pin ALL auth-flow cookies (including PKCE, state, nonce) to
 * `.windedvertigo.com`. Without this, Auth.js defaults leave them
 * host-scoped — and because every Pool A app's auth subtree is reachable at
 * both the apex `windedvertigo.com` and `www.windedvertigo.com`, a cookie
 * set for one host would not be sent to the other on the callback →
 * CallbackRouteError → ?error=Configuration. Domain-scoping makes the
 * auth-flow cookies host-agnostic across the apex/www pair.
 *
 * Note: the route handler also normalises every auth request onto a single
 * canonical apex origin (see `route-handler.ts`), so in practice the flow no
 * longer hops hosts mid-handshake — but the domain scope is still required
 * for cross-app SSO on `.windedvertigo.com`.
 */

const isProduction = () => process.env.NODE_ENV === "production";
const domain = () => (isProduction() ? ".windedvertigo.com" : undefined);

export const harbourCookies = {
  sessionToken: {
    name: "authjs.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction(),
      domain: domain(),
    },
  },
  callbackUrl: {
    name: "authjs.callback-url",
    options: {
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction(),
      domain: domain(),
    },
  },
  csrfToken: {
    name: "authjs.csrf-token",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction(),
      domain: domain(),
    },
  },
  // PKCE, state, and nonce cookies must also be domain-scoped so they survive
  // a www ↔ non-www host switch between the signin redirect and the callback.
  pkceCodeVerifier: {
    name: "authjs.pkce.code_verifier",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction(),
      domain: domain(),
      maxAge: 60 * 15,
    },
  },
  state: {
    name: "authjs.state",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction(),
      domain: domain(),
      maxAge: 60 * 15,
    },
  },
  nonce: {
    name: "authjs.nonce",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction(),
      domain: domain(),
    },
  },
};
