import type { TeamColour } from '@/state/types';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomCode(prefix = ''): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return prefix ? `${prefix}-${code}` : code;
}

export function uid(prefix = ''): string {
  const r = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`;
}

export const TEAM_COLOURS: TeamColour[] = [
  'cadet',
  'redwood',
  'sienna',
  'champagne',
  'deep',
  'sand',
];

export function teamColourHex(colour: TeamColour): string {
  switch (colour) {
    case 'cadet':
      return '#273248';
    case 'redwood':
      return '#b15043';
    case 'sienna':
      return '#cb7858';
    case 'champagne':
      return '#ffebd2';
    case 'deep':
      return '#141c2c';
    case 'sand':
      return '#e9d0a8';
  }
}

export function teamDisplayName(colour: TeamColour): string {
  return `team ${colour}`;
}
