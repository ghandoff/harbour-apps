// durable object: one per session code. holds the live websocket fan-out
// and caches the last `state` payload so late joiners (participants, walls)
// get a snapshot immediately on connect.
//
// this is the cloudflare-hosted equivalent of `server/index.ts`.
// free-tier budget: 1M requests/day + durable-objects usage included in
// cloudflare's default worker plan. one session = one durable object
// instance, serialised by id (== session code).

interface StoredState {
  payload: unknown;
  at: number;
}

export class SessionRoom {
  private state: DurableObjectState;
  private sockets = new Set<WebSocket>();
  private lastState: StoredState | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
    // hydrate the last-known state from durable storage so a cold-start
    // (all clients disconnected, DO evicted) doesn't lose the session.
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<StoredState>('lastState');
      if (stored) this.lastState = stored;
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket upgrade', { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.accept(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private accept(ws: WebSocket) {
    ws.accept();
    this.sockets.add(ws);

    // hand the joiner the most recent state snapshot so they catch up
    // without waiting for the facilitator to take the next action.
    if (this.lastState) {
      try {
        ws.send(
          JSON.stringify({
            type: 'state',
            payload: this.lastState.payload,
            at: this.lastState.at,
            sender: 'room',
          }),
        );
      } catch {
        /* socket already closed */
      }
    }

    ws.addEventListener('message', async (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : '';
      if (!raw) return;
      let msg: { type?: string; payload?: unknown; at?: number; sender?: string };
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.type === 'state') {
        this.lastState = { payload: msg.payload, at: msg.at ?? Date.now() };
        await this.state.storage.put('lastState', this.lastState);
      }
      // fan-out to every other subscriber
      for (const peer of this.sockets) {
        if (peer === ws) continue;
        try {
          peer.send(raw);
        } catch {
          this.sockets.delete(peer);
        }
      }
    });

    const close = () => {
      this.sockets.delete(ws);
    };
    ws.addEventListener('close', close);
    ws.addEventListener('error', close);
  }
}
