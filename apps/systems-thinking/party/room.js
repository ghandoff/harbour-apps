// fan-out room for systems-thinking facilitator dashboards.
//
// architecture: room is NOT the system of record. the existing /api/session/*
// endpoints (Upstash Redis) remain authoritative. this room only relays events
// from those endpoints to the facilitator's WebSocket so the dashboard updates
// in real time instead of polling every 8 seconds.
//
// connection model:
//   - facilitator opens WS at /parties/main/{CODE}?role=facilitator&pin=NNNN
//     pin is verified against Redis on connect; bad pin → 403, connection rejected
//   - students never connect via WebSocket (they keep posting to /api/session/log)
//   - vercel api endpoints POST to /parties/main/{CODE} with x-internal-secret
//     header after writing to redis; room broadcasts the body verbatim to all
//     connected facilitator sockets
//
// the room holds no state — restart-safe by design.

const PIN_SALT = 'st-salt-2026';

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin + PIN_SALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchSession(env, code) {
  // matches the @upstash/redis SDK fallback: prefer UPSTASH_*, fall back to
  // KV_REST_API_* (the names vercel injects when upstash is provisioned via
  // the marketplace integration)
  const restUrl = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const restToken = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!restUrl || !restToken) return null;
  const url = `${restUrl}/get/session:${code}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${restToken}` },
  });
  if (!res.ok) return null;
  const { result } = await res.json();
  if (!result) return null;
  return typeof result === 'string' ? JSON.parse(result) : result;
}

export default class SystemsThinkingRoom {
  constructor(room) {
    this.room = room;
  }

  // verify facilitator PIN before upgrading to WebSocket
  static async onBeforeConnect(request, lobby) {
    try {
      const url = new URL(request.url);
      const role = url.searchParams.get('role');
      if (role !== 'facilitator') {
        return new Response('only facilitators connect via websocket', { status: 403 });
      }
      const pin = url.searchParams.get('pin');
      if (!pin || !/^\d{4}$/.test(pin)) {
        return new Response('invalid pin format', { status: 400 });
      }
      const session = await fetchSession(lobby.env, lobby.id);
      if (!session) return new Response('session not found', { status: 404 });
      const hashed = await hashPin(pin);
      if (hashed !== session.facilitatorPin) {
        return new Response('invalid pin', { status: 403 });
      }
      return request;
    } catch (err) {
      return new Response('auth error: ' + err.message, { status: 500 });
    }
  }

  onConnect(conn) {
    conn.send(JSON.stringify({ type: 'connected', code: this.room.id }));
  }

  // ingress from the vercel api endpoints (authenticated via shared secret)
  async onRequest(request) {
    if (request.method !== 'POST') {
      return new Response('method not allowed', { status: 405 });
    }
    const secret = request.headers.get('x-internal-secret');
    if (!secret || secret !== this.room.env.PARTYKIT_INTERNAL_SECRET) {
      return new Response('forbidden', { status: 403 });
    }
    let body;
    try {
      body = await request.text();
    } catch {
      return new Response('bad body', { status: 400 });
    }
    // broadcast verbatim to every connected facilitator socket
    this.room.broadcast(body);
    return new Response('ok');
  }
}
