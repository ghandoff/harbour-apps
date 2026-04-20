// cloudflare worker entry. serves the vite dist as static assets under
// /harbour/values-auction/*, and upgrades /harbour/values-auction/ws to a
// websocket hosted in a per-session durable object (SessionRoom below).
//
// deploy: `cd apps/values-auction && npm run deploy` (requires `wrangler login` once).
// live at https://wv-harbour-values-auction.windedvertigo.workers.dev/harbour/values-auction/
// proxied via the sibling `ghandoff/windedvertigo` repo to
// https://windedvertigo.com/harbour/values-auction/.

import { SessionRoom } from './session-room.js';
export { SessionRoom };

export interface Env {
  ASSETS: Fetcher;
  SESSION_ROOM: DurableObjectNamespace;
}

const BASE = '/harbour/values-auction';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // normalise: requests may arrive at `/` (direct workers.dev hit) or
    // `/harbour/values-auction/...` (proxied through windedvertigo.com).
    let path = url.pathname;
    if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';

    // websocket upgrade → durable object per session code.
    if (path === '/ws' || path.endsWith('/ws')) {
      const sessionId = (url.searchParams.get('session') ?? 'DEMO').toUpperCase();
      const id = env.SESSION_ROOM.idFromName(sessionId);
      const room = env.SESSION_ROOM.get(id);
      return room.fetch(request);
    }

    // everything else is a static asset. rewrite the request url so the
    // assets binding can find it (the assets are stored at root in ./dist
    // but referenced in html with the /harbour/values-auction/ prefix;
    // we strip that prefix before asking the binding).
    const assetUrl = new URL(request.url);
    assetUrl.pathname = path === '/' ? '/index.html' : path;
    const assetReq = new Request(assetUrl.toString(), request);
    return env.ASSETS.fetch(assetReq);
  },
};
