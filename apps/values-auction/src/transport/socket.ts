import type { Transport, TransportMessage, Role } from './transport.js';

export interface SocketTransportOptions {
  url?: string;
}

export class SocketTransport implements Transport {
  private ws?: WebSocket;
  private handlers = new Set<(msg: TransportMessage) => void>();
  private url: string;
  private sessionId?: string;
  private role?: Role;
  private queue: TransportMessage[] = [];
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  constructor(options: SocketTransportOptions = {}) {
    const envUrl = (import.meta as any).env?.VITE_WS_URL as string | undefined;
    this.url = options.url ?? envUrl ?? this.defaultUrl();
  }

  private defaultUrl(): string {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    // production: same-origin WS endpoint at `<base>ws`. the cloudflare
    // worker upgrades this to a durable object per session code.
    if ((import.meta as any).env?.PROD) {
      const base = (import.meta as any).env?.BASE_URL ?? '/';
      const host = location.host;
      const path = `${base}ws`.replace(/\/+/g, '/');
      return `${proto}://${host}${path}`;
    }
    // dev: local ws hub on :8787 (see `server/index.ts`).
    return `${proto}://${location.hostname}:8787`;
  }

  async connect(sessionId: string, role: Role): Promise<void> {
    this.sessionId = sessionId;
    this.role = role;
    await this.open();
  }

  private open(): Promise<void> {
    return new Promise((resolve) => {
      const params = new URLSearchParams({ session: this.sessionId!, role: this.role! });
      this.ws = new WebSocket(`${this.url}?${params.toString()}`);
      this.ws.addEventListener('open', () => {
        while (this.queue.length > 0) {
          const m = this.queue.shift();
          if (m) this.ws!.send(JSON.stringify(m));
        }
        resolve();
      });
      this.ws.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as TransportMessage;
          for (const h of this.handlers) h(msg);
        } catch {
          /* ignore */
        }
      });
      this.ws.addEventListener('close', () => {
        this.scheduleReconnect();
      });
      this.ws.addEventListener('error', () => {
        this.ws?.close();
      });
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.sessionId && this.role) this.open().catch(() => this.scheduleReconnect());
    }, 2000);
  }

  send(msg: TransportMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  subscribe(handler: (msg: TransportMessage) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = undefined;
    this.handlers.clear();
  }
}
