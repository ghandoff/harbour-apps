import { describe, it, expect, vi } from 'vitest';
import { Store } from '../src/state/store.js';
import { initialSession } from '../src/state/reducers.js';

describe('store', () => {
  it('subscribe fires with initial state', () => {
    const store = new Store(initialSession('x', 'f', 0), { senderId: 'me', authoritative: true });
    const fn = vi.fn();
    store.subscribe(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('dispatch updates state (authoritative)', () => {
    const store = new Store(initialSession('x', 'f', 0), { senderId: 'me', authoritative: true });
    store.dispatch({ type: 'joinParticipant', participantId: 'p', displayName: 'a', at: 1 });
    expect(store.getState().participants.length).toBe(1);
  });

  it('unsubscribe stops notifications', () => {
    const store = new Store(initialSession('x', 'f', 0), { senderId: 'me', authoritative: true });
    const fn = vi.fn();
    const off = store.subscribe(fn);
    off();
    store.dispatch({ type: 'joinParticipant', participantId: 'p', displayName: 'a', at: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('non-authoritative without transport reduces locally', () => {
    const store = new Store(initialSession('x', 'f', 0), { senderId: 'me', authoritative: false });
    store.dispatch({ type: 'joinParticipant', participantId: 'p', displayName: 'a', at: 1 });
    expect(store.getState().participants.length).toBe(1);
  });
});
