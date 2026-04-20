import type { Transport } from './transport.js';
import { BroadcastTransport } from './broadcast.js';
import { SocketTransport } from './socket.js';

export type { Transport, TransportMessage, Role } from './transport.js';
export { BroadcastTransport, SocketTransport };

export function createTransport(): Transport {
  const kind = (import.meta as any).env?.VITE_TRANSPORT as string | undefined;
  if (kind === 'socket') return new SocketTransport();
  return new BroadcastTransport();
}
