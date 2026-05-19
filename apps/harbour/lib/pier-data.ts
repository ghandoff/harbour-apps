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
  "values-auction": ["leadership"],
  "read-the-room": ["leadership", "classroom"],
  "regenerative-practices": ["leadership", "classroom"],
  "co-design-rubric": ["classroom"],
  "depth-chart": ["classroom"],
  creaseworks: ["family"],
  "raft-house": ["family"],
  "deep-deck": ["family"],
};

export const WAVE_MAP: Record<string, Wave> = {
  "vertigo-vault": "wave-1",
  "lines-become-loops": "wave-1",
  "values-auction": "wave-1",
  "read-the-room": "wave-1",
  "regenerative-practices": "wave-1",
  "co-design-rubric": "wave-1",
  "depth-chart": "coming-soon",
  creaseworks: "wave-2",
  "raft-house": "wave-2",
  "deep-deck": "wave-2",
};
