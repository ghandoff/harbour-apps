import type { Transport } from './transport.js';
import { BroadcastTransport } from './broadcast.js';
import { SocketTransport } from './socket.js';

export type { Transport, TransportMessage, Role } from './transport.js';
export { BroadcastTransport, SocketTransport };

export function createTransport(): Transport {
  const env = (import.meta as any).env ?? {};
  const kind = env.VITE_TRANSPORT as string | undefined;
  if (kind === 'socket') return new SocketTransport();
  if (kind === 'broadcast') return new BroadcastTransport();
  // default: cross-device websocket in production (against the cloudflare
  // worker), BroadcastChannel in dev (no server needed).
  if (env.PROD) return new SocketTransport();
  return new BroadcastTransport();
}
