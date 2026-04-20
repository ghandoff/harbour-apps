export type ActId = 'arrival' | 'grouping' | 'scene' | 'strategy' | 'auction' | 'reflection' | 'regather';
export type ActMode = 'plenary' | 'team-room' | 'plenary-to-team' | 'plenary-or-team';

export interface ActDef {
  id: ActId;
  order: number;
  name: string;
  durationMs: number;
  mode: ActMode;
}

export const ACTS: ActDef[] = [
  { id: 'arrival', order: 0, name: 'arrival', durationMs: 3 * 60_000, mode: 'plenary' },
  { id: 'grouping', order: 1, name: 'grouping', durationMs: 3 * 60_000, mode: 'plenary-to-team' },
  { id: 'scene', order: 2, name: 'set the scene', durationMs: 4 * 60_000, mode: 'team-room' },
  { id: 'strategy', order: 3, name: 'team strategy', durationMs: 5 * 60_000, mode: 'team-room' },
  { id: 'auction', order: 4, name: 'auction', durationMs: 10 * 60_000, mode: 'plenary' },
  { id: 'reflection', order: 5, name: 'reflection', durationMs: 5 * 60_000, mode: 'team-room' },
  { id: 'regather', order: 6, name: 'regather', durationMs: 5 * 60_000, mode: 'plenary' },
];

export function getAct(id: ActId): ActDef {
  const act = ACTS.find((a) => a.id === id);
  if (!act) throw new Error(`unknown act: ${id}`);
  return act;
}

export function nextAct(id: ActId): ActId | null {
  const current = getAct(id);
  const next = ACTS.find((a) => a.order === current.order + 1);
  return next?.id ?? null;
}
