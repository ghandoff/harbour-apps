import type { Transport, TransportMessage, Role } from './transport.js';

export class BroadcastTransport implements Transport {
  private channel?: BroadcastChannel;
  private handlers = new Set<(msg: TransportMessage) => void>();
  private sessionId?: string;
  private role?: Role;

  async connect(sessionId: string, role: Role): Promise<void> {
    this.sessionId = sessionId;
    this.role = role;
    const name = `values-auction:${sessionId}`;
    this.channel = new BroadcastChannel(name);
    this.channel.addEventListener('message', (ev) => {
      const msg = ev.data as TransportMessage;
      for (const h of this.handlers) h(msg);
    });
  }

  send(msg: TransportMessage): void {
    if (!this.channel) throw new Error('transport not connected');
    this.channel.postMessage(msg);
  }

  subscribe(handler: (msg: TransportMessage) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect(): void {
    this.channel?.close();
    this.channel = undefined;
    this.handlers.clear();
  }

  get info() {
    return { sessionId: this.sessionId, role: this.role };
  }
}
