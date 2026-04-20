import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BroadcastTransport } from '../src/transport/broadcast.js';
import type { TransportMessage } from '../src/transport/transport.js';

class FakeChannel {
  static channels = new Map<string, Set<FakeChannel>>();
  listeners = new Set<(ev: MessageEvent) => void>();
  constructor(public name: string) {
    const set = FakeChannel.channels.get(name) ?? new Set();
    set.add(this);
    FakeChannel.channels.set(name, set);
  }
  postMessage(data: unknown) {
    const peers = FakeChannel.channels.get(this.name);
    if (!peers) return;
    for (const p of peers) {
      if (p === this) continue;
      for (const l of p.listeners) l(new MessageEvent('message', { data }));
    }
  }
  addEventListener(_type: string, fn: (ev: MessageEvent) => void) { this.listeners.add(fn); }
  removeEventListener(_type: string, fn: (ev: MessageEvent) => void) { this.listeners.delete(fn); }
  close() {
    const peers = FakeChannel.channels.get(this.name);
    peers?.delete(this);
    this.listeners.clear();
  }
}

beforeEach(() => {
  FakeChannel.channels.clear();
  (globalThis as any).BroadcastChannel = FakeChannel;
});

describe('BroadcastTransport contract', () => {
  it('round-trips a message to another transport on same session', async () => {
    const a = new BroadcastTransport();
    const b = new BroadcastTransport();
    await a.connect('SESS', 'facilitator');
    await b.connect('SESS', 'participant');
    const received: TransportMessage[] = [];
    b.subscribe((m) => received.push(m));
    a.send({ type: 'action', payload: { hi: 1 }, at: 1, sender: 'a' });
    await new Promise((r) => setTimeout(r, 5));
    expect(received.length).toBe(1);
    expect((received[0].payload as any).hi).toBe(1);
  });

  it('subscribe returns an unsubscribe fn', async () => {
    const a = new BroadcastTransport();
    const b = new BroadcastTransport();
    await a.connect('SESS2', 'facilitator');
    await b.connect('SESS2', 'participant');
    const fn = vi.fn();
    const off = b.subscribe(fn);
    a.send({ type: 'action', payload: 1, at: 0, sender: 'a' });
    await new Promise((r) => setTimeout(r, 5));
    off();
    a.send({ type: 'action', payload: 2, at: 0, sender: 'a' });
    await new Promise((r) => setTimeout(r, 5));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('disconnect closes channel', async () => {
    const a = new BroadcastTransport();
    await a.connect('SESS3', 'facilitator');
    a.disconnect();
    expect(() => a.send({ type: 'action', payload: 1, at: 0, sender: 'a' })).toThrow();
  });
});
