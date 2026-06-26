/**
 * creaseworks-eval — scoring, faceted by lens.
 *
 * Turns a submission's raw answers into per-lens health scores (0–1),
 * the collection-matrix fields, and a generic per-item normaliser the
 * dashboard uses to measure where the room converges vs splits.
 *
 * A lens score is the mean of its present, scorable items — unanswered
 * items are skipped, never counted as zero, so salience-first marking
 * isn't punished for being partial.
 */

import type { EvalItem, Layer } from "./eval-rubric";
import { itemById } from "./eval-rubric";

export type RawAnswers = Record<string, number | string | string[]>;

/* ── per-value normalisers (→ 0..1, or null when absent/unscorable) ── */

function s5(v: unknown): number | null {
  return typeof v === "number" && v >= 1 && v <= 5 ? (v - 1) / 4 : null;
}
function s5rev(v: unknown): number | null {
  return typeof v === "number" && v >= 1 && v <= 5 ? (5 - v) / 4 : null;
}
function gate(v: unknown): number | null {
  if (v === "clear") return 1;
  if (v === "partial") return 0.5;
  if (v === "blocked") return 0;
  return null;
}
function yn(v: unknown): number | null {
  if (v === "yes") return 1;
  if (v === "unsure") return 0.5;
  if (v === "no") return 0;
  return null;
}
function doorScore(v: unknown): number | null {
  if (typeof v !== "string") return null;
  if (v.startsWith("yes")) return 1;
  if (v.startsWith("light")) return 0.5;
  if (v === "no") return 0;
  return null;
}
function decisiveScore(v: unknown): number | null {
  if (typeof v !== "string") return null;
  if (v.startsWith("return")) return 1;
  if (v === "partial") return 0.5;
  if (v.startsWith("fun")) return 0;
  return null;
}
function redflagScore(v: unknown): number | null {
  if (v === "none") return 1;
  if (v === "one or two") return 0.5;
  if (v === "several") return 0;
  return null;
}

function mean(vals: (number | null)[]): number | null {
  const present = vals.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Normalise any item's value to a 0–1 health score, or null if the item
 * carries no health dimension (free text, the linger choice, the verdict
 * call). Used for lens scores AND for divergence on numeric-ish items.
 */
export function normalizeItem(item: EvalItem, value: unknown): number | null {
  switch (item.type) {
    case "scale5":
      return item.reverse ? s5rev(value) : s5(value);
    case "gate3":
      return gate(value);
    case "yesno":
      return yn(value);
    case "triad":
      return Array.isArray(value) ? value.length / 3 : null;
    case "choice":
      if (item.id === "brief-l3") return doorScore(value);
      if (item.id === "fw-decisive") return decisiveScore(value);
      if (item.id === "fw-guard-redflags") return redflagScore(value);
      return null; // felt-linger, verdict-call: categorical, no health axis
    default:
      return null; // text
  }
}

function scoreLayer(layer: Layer, a: RawAnswers): number | null {
  const vals: (number | null)[] = [];
  for (const id of Object.keys(a)) {
    const item = itemById(id);
    if (!item || item.layer !== layer) continue;
    vals.push(normalizeItem(item, a[id]));
  }
  return mean(vals);
}

/* ── per-lens scores (the heatmap columns) ──────────────────── */

export const SCORED_LAYERS: { key: Layer; label: string }[] = [
  { key: "cards", label: "felt play" },
  { key: "lens1", label: "lens 1 · play" },
  { key: "lens2", label: "lens 2 · mechanics" },
  { key: "lens3", label: "lens 3 · justice" },
  { key: "lens4", label: "lens 4 · aliveness" },
];

export function layerScore(layer: Layer, a: RawAnswers): number | null {
  return scoreLayer(layer, a);
}

/* ── matrix fields (jamie's collection matrix) ──────────────── */

export function gatePass(a: RawAnswers): boolean | null {
  const parts = [a["fw-gate-essential"], a["fw-gate-routes"], a["fw-gate-reachable"]];
  if (parts.every((p) => p === undefined)) return null;
  return parts.every((p) => p === "yes");
}

export function layer3Door(a: RawAnswers): string | null {
  const v = a["brief-l3"];
  return typeof v === "string" ? v : null;
}

export function justicePresent(a: RawAnswers): boolean | null {
  const triad = Array.isArray(a["fnd-triad"]) ? a["fnd-triad"].includes("justice") : null;
  const guard = a["fw-guard-justice"]; // legacy id; kept for safety
  if (triad === null && guard === undefined) return null;
  return triad === true || guard === "yes";
}

export function verdictCall(a: RawAnswers): string | null {
  const v = a["verdict-call"];
  return typeof v === "string" ? v : null;
}

export function coherenceRaw(a: RawAnswers): number | null {
  const v = a["verdict-coherence"];
  return typeof v === "number" ? v : null;
}

export function frameworkFit(a: RawAnswers): number | null {
  // lens 5 capture: how well the framework caught the felt reality
  const v = a["lens5-capture"];
  return typeof v === "number" ? v : null;
}
