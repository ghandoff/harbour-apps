const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function sessionCode(prefix = 'VA'): string {
  const rand = Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  return `${prefix}-${rand}`;
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const TEAM_COLOURS = ['cadet', 'redwood', 'sienna', 'champagne', 'deep', 'sand'] as const;
export type TeamColour = (typeof TEAM_COLOURS)[number];

export function teamColour(index: number): TeamColour {
  return TEAM_COLOURS[index % TEAM_COLOURS.length];
}

const TEAM_NAMES: Record<TeamColour, string> = {
  cadet: 'team cadet',
  redwood: 'team redwood',
  sienna: 'team sienna',
  champagne: 'team champagne',
  deep: 'team deep',
  sand: 'team sand',
};

export function teamNameFor(colour: TeamColour): string {
  return TEAM_NAMES[colour];
}
