import type { ActId } from '@/state/types';

export interface ActDefinition {
  id: ActId;
  index: number;
  name: string;
  durationMs: number;
  mode: 'plenary' | 'team' | 'plenary-team';
  tempo: 'calm' | 'snappy';
  description: string;
}

export const ACTS: ActDefinition[] = [
  {
    id: 'arrival',
    index: 0,
    name: 'arrival',
    durationMs: 3 * 60_000,
    mode: 'plenary',
    tempo: 'calm',
    description: 'participants join and settle in.',
  },
  {
    id: 'grouping',
    index: 1,
    name: 'grouping',
    durationMs: 3 * 60_000,
    mode: 'plenary-team',
    tempo: 'calm',
    description: 'archetype sort → teams assigned.',
  },
  {
    id: 'scene',
    index: 2,
    name: 'set the scene',
    durationMs: 4 * 60_000,
    mode: 'team',
    tempo: 'calm',
    description: 'each team receives their startup and challenge.',
  },
  {
    id: 'strategy',
    index: 3,
    name: 'team strategy',
    durationMs: 5 * 60_000,
    mode: 'team',
    tempo: 'calm',
    description: 'agree on must-have / nice / won’t-fight-for and soft ceilings.',
  },
  {
    id: 'company',
    index: 4,
    name: 'meet your company',
    durationMs: 3 * 60_000,
    mode: 'team',
    tempo: 'calm',
    description: 'confirm your company, your seed values, and see your rivals before the auction.',
  },
  {
    id: 'auction',
    index: 5,
    name: 'auction',
    durationMs: 10 * 60_000,
    mode: 'plenary',
    tempo: 'snappy',
    description: 'live bidding. losses are final.',
  },
  {
    id: 'reflection',
    index: 6,
    name: 'reflection',
    durationMs: 5 * 60_000,
    mode: 'team',
    tempo: 'calm',
    description: 'four prompts, one purpose statement.',
  },
  {
    id: 'regather',
    index: 7,
    name: 'regather',
    durationMs: 5 * 60_000,
    mode: 'plenary',
    tempo: 'calm',
    description: 'share identity cards, debrief.',
  },
];

export function getAct(id: ActId): ActDefinition {
  const act = ACTS.find((a) => a.id === id);
  if (!act) throw new Error(`unknown act: ${id}`);
  return act;
}

export function nextAct(id: ActId): ActId | null {
  const current = getAct(id);
  const next = ACTS[current.index + 1];
  return next ? next.id : null;
}

export function actPosition(id: ActId): { index: number; total: number; current: ActDefinition; next?: ActDefinition } {
  const current = getAct(id);
  const next = ACTS[current.index + 1];
  return {
    index: current.index + 1,
    total: ACTS.length,
    current,
    next,
  };
}
