/**
 * Pier and launch-wave assignments for harbour games.
 *
 * Acts as the safety net: if a Notion editor renames the `Pier` or
 * `Launch Wave` properties, or wipes a row's values, the landing page
 * still renders correct pier sections via these maps.
 *
 * Notion is the source of truth at runtime — these maps are only used
 * when a row's Notion values are absent. The seed script
 * (scripts/seed-pier-fields.mjs) uses the same mapping to populate
 * the Notion DB initially.
 */

export type Pier = "leadership" | "classroom" | "family" | "drydock";
export type Wave = "wave-1" | "wave-2" | "coming-soon";

export const PIER_MAP: Record<string, Pier[]> = {
  "vertigo-vault": ["leadership", "classroom"],
  "lines-become-loops": ["leadership", "classroom"],
  // values-companion is the freemium tier (replaces values-auction in the
  // PRME-launch IA). values-auction (paid) stays in PIER_MAP separately
  // so the fallback still routes the paid URL when it goes live.
  "values-companion": ["leadership", "classroom"],
  "values-auction": ["leadership", "classroom"],
  "read-the-room": ["leadership", "classroom"],
  "regenerative-practices": ["leadership", "classroom"],
  // co-rubric-companion = freemium, co-rubric = paid (both stay mapped so
  // the fallback covers either pier IA configuration).
  "co-rubric-companion": ["classroom", "leadership"],
  "co-rubric": ["classroom", "leadership"],
  "cuts-catalogue": ["leadership", "classroom"],
  "depth-chart": ["classroom"],
  creaseworks: ["family"],
  "raft-house": ["family"],
  "deep-deck": ["family"],
};

/**
 * Profile role → the content pier(s) that role steers toward. Used to gently
 * recommend boats that fit a member's stated role (recognition, not upsell):
 *   facilitator → leadership, educator → classroom, parent → family.
 * "explorer" / unset stays broad (no targeting).
 */
export const ROLE_PIERS: Record<string, Pier[]> = {
  facilitator: ["leadership"],
  educator: ["classroom"],
  "parent-caregiver": ["family"],
};

/**
 * App slugs whose content pier matches any of the user's role-piers. Shared by
 * the signed-in hub (`/api/me`) and the shop's "a fit for you" highlighting so
 * both surfaces recommend the same boats from one source of truth.
 */
export function recommendFromRoles(roles: string[]): string[] {
  const target = new Set<Pier>(roles.flatMap((r) => ROLE_PIERS[r] ?? []));
  if (target.size === 0) return [];
  return Object.entries(PIER_MAP)
    .filter(([, piers]) => piers.some((p) => target.has(p)))
    .map(([slug]) => slug);
}

export const WAVE_MAP: Record<string, Wave> = {
  "vertigo-vault": "wave-1",
  "lines-become-loops": "wave-1",
  "values-companion": "wave-1",
  "values-auction": "wave-1",
  "read-the-room": "wave-1",
  "regenerative-practices": "wave-1",
  "co-rubric-companion": "wave-1",
  "co-rubric": "wave-1",
  "cuts-catalogue": "wave-1",
  "depth-chart": "coming-soon",
  creaseworks: "wave-2",
  "raft-house": "wave-2",
  "deep-deck": "wave-2",
};
