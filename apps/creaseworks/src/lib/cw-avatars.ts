/**
 * cw-avatars — the anonymous player vocabulary.
 *
 * A player (a child) is identified only by an avatar: a colour + an animal
 * (e.g. "teal-otter"). 6 colours × 6 animals = 36 kid-memorable combos, and
 * — load-bearing for the privacy stance — there is NO free-text name field
 * anywhere, so the roster literally cannot hold PII. The adult's mental map
 * of "teal-otter = my daughter" stays off-system.
 *
 * Pure module (no client/server-only imports) so the kid picker, the
 * grown-up roster setup, AND the API validators all share one source of
 * truth: an avatar the server would reject can never be one the picker
 * offered.
 */

export interface AvatarColour {
  key: string;
  hex: string; // tile background — vibrant secondary palette, never champagne
  label: string;
}
export interface AvatarAnimal {
  key: string;
  emoji: string;
  label: string;
}

export const AVATAR_COLOURS: AvatarColour[] = [
  { key: "teal", hex: "#2ba79f", label: "teal" },
  { key: "coral", hex: "#cb7858", label: "coral" },
  { key: "plum", hex: "#8b5c9e", label: "plum" },
  { key: "sun", hex: "#e3a83c", label: "sun" },
  { key: "moss", hex: "#5f9e63", label: "moss" },
  { key: "sky", hex: "#4f86c6", label: "sky" },
];

export const AVATAR_ANIMALS: AvatarAnimal[] = [
  { key: "otter", emoji: "🦦", label: "otter" },
  { key: "fox", emoji: "🦊", label: "fox" },
  { key: "owl", emoji: "🦉", label: "owl" },
  { key: "frog", emoji: "🐸", label: "frog" },
  { key: "bear", emoji: "🐻", label: "bear" },
  { key: "cat", emoji: "🐱", label: "cat" },
];

const COLOUR_BY_KEY = new Map(AVATAR_COLOURS.map((c) => [c.key, c]));
const ANIMAL_BY_KEY = new Map(AVATAR_ANIMALS.map((a) => [a.key, a]));

/** Every avatar, in a stable order (grid layout for setup). */
export const ALL_AVATARS: string[] = AVATAR_COLOURS.flatMap((c) =>
  AVATAR_ANIMALS.map((a) => `${c.key}-${a.key}`),
);

export function avatarParts(avatar: string): { colour: string; animal: string } | null {
  const [colour, animal] = avatar.split("-");
  if (!colour || !animal) return null;
  if (!COLOUR_BY_KEY.has(colour) || !ANIMAL_BY_KEY.has(animal)) return null;
  return { colour, animal };
}

export function isValidAvatar(avatar: unknown): avatar is string {
  return typeof avatar === "string" && avatarParts(avatar) !== null;
}

export function avatarHex(avatar: string): string {
  const p = avatarParts(avatar);
  return (p && COLOUR_BY_KEY.get(p.colour)?.hex) || "var(--wv-cadet)";
}

export function avatarEmoji(avatar: string): string {
  const p = avatarParts(avatar);
  return (p && ANIMAL_BY_KEY.get(p.animal)?.emoji) || "❓";
}

/** "teal otter" — for the rare bit of UI copy; never a child's real name. */
export function avatarLabel(avatar: string): string {
  const p = avatarParts(avatar);
  if (!p) return avatar;
  return `${COLOUR_BY_KEY.get(p.colour)?.label} ${ANIMAL_BY_KEY.get(p.animal)?.label}`;
}
