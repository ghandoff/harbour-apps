import type { Action, Session } from './types.js';
import { reduce } from './reducers.js';
import type { Transport, TransportMessage } from '../transport/transport.js';

type Listener = (s: Session) => void;

export class Store {
  private state: Session;
  private listeners = new Set<Listener>();
  private transport?: Transport;
  private senderId: string;
  private authoritative: boolean;
  private unsubscribeTransport?: () => void;

  constructor(initial: Session, options: { senderId: string; authoritative?: boolean }) {
    this.state = initial;
    this.senderId = options.senderId;
    this.authoritative = options.authoritative ?? false;
  }

  getState(): Session {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private setState(next: Session) {
    if (next === this.state) return;
    this.state = next;
    for (const l of this.listeners) l(this.state);
  }

  dispatch(action: Action) {
    if (this.authoritative) {
      const next = reduce(this.state, action);
      this.setState(next);
      if (this.transport) {
        this.transport.send({ type: 'state', payload: next, at: Date.now(), sender: this.senderId });
      }
    } else {
      if (this.transport) {
        this.transport.send({ type: 'action', payload: action, at: Date.now(), sender: this.senderId });
      } else {
        const next = reduce(this.state, action);
        this.setState(next);
      }
    }
  }

  attachTransport(transport: Transport) {
    this.transport = transport;
    this.unsubscribeTransport?.();
    this.unsubscribeTransport = transport.subscribe((msg) => this.onTransportMessage(msg));
  }

  private onTransportMessage(msg: TransportMessage) {
    if (msg.sender === this.senderId) return;
    if (msg.type === 'state') {
      this.setState(msg.payload as Session);
      return;
    }
    if (msg.type === 'action' && this.authoritative) {
      const action = msg.payload as { type: string };
      if (action.type === 'syncRequest') {
        this.transport?.send({ type: 'state', payload: this.state, at: Date.now(), sender: this.senderId });
        return;
      }
      const next = reduce(this.state, action as Action);
      this.setState(next);
      this.transport?.send({ type: 'state', payload: next, at: Date.now(), sender: this.senderId });
    }
  }

  receiveState(s: Session) {
    this.setState(s);
  }
}
