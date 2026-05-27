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

// Shared cache + CORS headers. Short edge TTL (5 min) so a deploy
// propagates quickly; browsers can serve stale for a day while
// revalidating in the background. CF's assets binding sometimes
// guesses application/octet-stream — we set Content-Type explicitly
// per path. Permissive CORS so the widget + data are embeddable from
// any harbour origin.
const COMMON_CACHE = "public, max-age=300, s-maxage=300, stale-while-revalidate=86400";

const SERVED_PATHS: Record<string, string> = {
  "/harbour-nav-widget.js": "application/javascript; charset=utf-8",
  // Data file consumed by the React HarbourNav at runtime so changes
  // to HARBOUR_APPS reach every consumer without a sweep redeploy.
  "/harbour-apps.json": "application/json; charset=utf-8",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const contentType = SERVED_PATHS[url.pathname];

    // Only serve the paths we explicitly own. Anything else 404s so
    // this worker can't accidentally claim traffic the CF route hasn't
    // explicitly given it.
    if (!contentType) {
      return new Response("not found", { status: 404 });
    }

    // Delegate the actual fetch to the Static Assets binding so CF
    // handles ETag, conditional requests, and range support for us.
    const response = await env.ASSETS.fetch(request);

    // Layer our cache + content-type headers on top of whatever
    // ASSETS returns. Preserves status code (200/304/etc) and body.
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", COMMON_CACHE);
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
