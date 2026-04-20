export type Role = 'facilitator' | 'participant' | 'wall';

export interface TransportMessage {
  type: 'action' | 'state';
  payload: unknown;
  at: number;
  sender: string;
}

export interface Transport {
  connect(sessionId: string, role: Role): Promise<void>;
  send(msg: TransportMessage): void;
  subscribe(handler: (msg: TransportMessage) => void): () => void;
  disconnect(): void;
}
