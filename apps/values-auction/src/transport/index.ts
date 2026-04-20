import { BroadcastTransport } from '@/transport/broadcast';
import { SocketTransport } from '@/transport/socket';
import type { Transport } from '@/transport/transport';
import { uid } from '@/utils/id';

export function createTransport(clientId = uid('c')): Transport {
  const env = (import.meta.env as Record<string, string | undefined>) ?? {};
  const mode = env.VITE_TRANSPORT ?? 'broadcast';
  if (mode === 'socket') {
    const url = env.VITE_WS_URL ?? 'ws://localhost:8787';
    return new SocketTransport(clientId, url);
  }
  return new BroadcastTransport(clientId);
}

export * from '@/transport/transport';
