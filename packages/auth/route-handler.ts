import { Auth } from "@auth/core";
import type { NextAuthConfig } from "next-auth";
import { NextRequest } from "next/server";

/**
 * Create a custom Auth.js route handler for a harbour app.
 *
 * Bypasses next-auth's `reqWithEnvURL` by calling `@auth/core`'s `Auth()`
 * directly with a plain `Request` (not `NextRequest`). This avoids NextURL
 * basePath stripping that breaks Auth.js's action regex when apps use
 * Next.js basePath (e.g. `/harbour/creaseworks`).
 *
 * The basePath prepend is idempotent: Next.js usually strips the basePath
 * from `req.url` in route handlers, but Vercel rewrites can deliver the
 * full path. We normalise to always include the prefix exactly once.
 *
 * Usage:
 * ```ts
 * // apps/creaseworks/src/app/api/auth/[...nextauth]/route.ts
 * import { createAuthRouteHandler } from "@windedvertigo/auth/route-handler";
 * import { authConfig } from "@/lib/auth";
 *
 * const { GET, POST } = createAuthRouteHandler("creaseworks", authConfig);
 * export { GET, POST };
 * ```
 *
 * `options.authUrl` lets an app pin the canonical auth origin explicitly,
 * overriding the `AUTH_URL` env var for host normalisation. Every Pool A
 * app's auth subtree is reached at BOTH the apex (`windedvertigo.com`) and
 * `www.windedvertigo.com` via direct CF Workers Routes; the handler rewrites
 * the request origin to a single canonical host so magic-link emails, OAuth
 * `redirect_uri`s, and post-signin redirects are all emitted on the same
 * host. The canonical host MUST be the apex, because the shared Google OAuth
 * client's redirect URIs are registered on the apex. Pass this when the
 * worker's `AUTH_URL` secret can't be relied on to carry the apex host.
 */
export function createAuthRouteHandler(
  appName: string,
  authConfig: NextAuthConfig,
  options: { authUrl?: string } = {},
) {
  // Empty appName = harbour hub itself, mounted at /harbour (no sub-path).
  // Each non-empty appName produces /harbour/<sub>. Matches the basePath
  // logic in `config.ts`.
  const basePath = appName ? `/harbour/${appName}` : `/harbour`;

  async function handler(req: NextRequest) {
    const url = new URL(req.url);

    // Ensure basePath appears exactly once in the pathname
    if (!url.pathname.startsWith(basePath)) {
      url.pathname = `${basePath}${url.pathname}`;
    }

    // Replace origin with the canonical auth URL (replicating what
    // reqWithEnvURL does). An explicit `options.authUrl` wins so an app can
    // pin its canonical apex host even when the worker's AUTH_URL secret
    // carries a different host (e.g. a stale `www.` value). Falls back
    // through AUTH_URL → NEXTAUTH_URL → NEXT_PUBLIC_APP_URL.
    const authUrl =
      options.authUrl ??
      process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL;
    if (authUrl) {
      const envOrigin = new URL(authUrl);
      url.protocol = envOrigin.protocol;
      url.host = envOrigin.host;
    }

    // Use plain Request (NOT NextRequest) to avoid NextURL basePath stripping
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      // @ts-expect-error duplex is required for streaming request bodies but
      // not yet in the TS Request type definition
      duplex: "half",
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await Auth(request, authConfig as any)) as Response;
    } catch (err) {
      // Surface the real error to worker logs — Auth.js swallows most
      // callback errors and redirects to ?error=Configuration without
      // exposing the cause.
      console.error("[harbour-auth][uncaught]", err);
      throw err;
    }
  }

  return { GET: handler, POST: handler };
}
