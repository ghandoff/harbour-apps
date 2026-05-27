/**
 * wv-harbour-nav-cdn
 *
 * A one-asset Cloudflare Worker that serves the harbour-nav-widget
 * bundle from a single source of truth. Source for the bundle lives
 * in packages/auth/harbour-nav-vanilla.tsx → built into ./public/
 * via packages/auth/build-vanilla.mjs.
 *
 * Why this worker exists:
 *   The bundle used to be copied into windedvertigo/site/public/.
 *   That created two homes for the same artifact and led to drift —
 *   any session that rebuilt the source had to remember to copy the
 *   output to the other repo, and any session that bumped the bundle
 *   on either side without syncing the other would silently revert
 *   half the work. This worker owns the asset; the URL stays the
 *   same (/harbour-nav-widget.js on windedvertigo.com); no consumer
 *   has to change.
 */

interface Env {
  ASSETS: Fetcher;
}

const CACHE_HEADERS: Record<string, string> = {
  // Short edge TTL so deploys propagate quickly (5 min). Browsers
  // get the same TTL but can serve stale for a day while revalidating
  // in the background.
  "Cache-Control":
    "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
  // The asset is plain JS — set the type explicitly because CF's
  // assets binding sometimes guesses application/octet-stream.
  "Content-Type": "application/javascript; charset=utf-8",
  // Permissive CORS — the widget is intended to be embeddable from
  // any origin that's part of the harbour. Tightening to a specific
  // allowlist is possible later if needed.
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // We only serve one path. Anything else returns 404 — this stops
    // the worker accidentally claiming traffic the route hasn't
    // explicitly given us.
    if (url.pathname !== "/harbour-nav-widget.js") {
      return new Response("not found", { status: 404 });
    }

    // Delegate the actual fetch to the Static Assets binding so CF
    // handles ETag, conditional requests, and range support for us.
    const response = await env.ASSETS.fetch(request);

    // Layer our cache + content-type headers on top of whatever
    // ASSETS returns. Preserves status code (200/304/etc) and body.
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CACHE_HEADERS)) {
      headers.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
