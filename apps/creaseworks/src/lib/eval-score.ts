/**
 * creaseworks-eval — scoring, three registers.
 *
 * Turns a submission's raw answers into per-layer health scores (0–1),
 * the collection-matrix fields, and a generic per-item normaliser the
 * dashboard uses for divergence. A layer score is the mean of its
 * present, scorable items — unanswered items are skipped, never zero, so
 * salience-first / partial marking isn't punished.
 *
 * Kid (delight), grown-up (involvement), and collective (lens) scores are
 * computed and displayed separately — never pooled into one number.
 */

import type { EvalItem, Layer } from "./eval-rubric";
import { itemById } from "./eval-rubric";

export type RawAnswers = Record<string, number | string | string[]>;

/* ── per-value normalisers (→ 0..1, or null) ────────────────── */

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

/** choices that carry a 0–1 health axis, keyed by item id. */
const CHOICE_SCORES: Record<string, Record<string, number>> = {
  "kid-again": { yes: 1, maybe: 0.5, no: 0 },
  "kid-ownway": { yes: 1, "sort of": 0.5, no: 0 },
  "kid-goldilocks": { "just right": 1, "too easy": 0.5, "too tricky": 0.5 },
  "watch-flow": { "moved freely": 1, "a bit of both": 0.5, "pushed through in order": 0 },
  "c-l3-door": { "yes — a real door": 1, "a little": 0.5, no: 0 },
  // c-verdict is categorical with no health axis → not listed
};

function mean(vals: (number | null)[]): number | null {
  const present = vals.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Normalise any item's value to 0–1, or null if it carries no health axis
 * (free text, the verdict call). Used for lens scores AND for divergence.
 */
export function normalizeItem(item: EvalItem, value: unknown): number | null {
  switch (item.type) {
    case "faces": {
      const opts = item.options ?? [];
      const i = typeof value === "string" ? opts.indexOf(value) : -1;
      return i >= 0 && opts.length > 1 ? i / (opts.length - 1) : null;
    }
    case "scale5":
      return item.reverse ? s5rev(value) : s5(value);
    case "gate3":
      return gate(value);
    case "yesno":
      return yn(value);
    case "checklist": {
      const opts = item.options ?? [];
      return Array.isArray(value) && opts.length ? value.length / opts.length : null;
    }
    case "choice": {
      const map = CHOICE_SCORES[item.id];
      return map && typeof value === "string" && value in map ? map[value] : null;
    }
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

/* ── heatmap columns ────────────────────────────────────────── */

export const SCORED_LAYERS: { key: Layer; label: string }[] = [
  { key: "kid", label: "kids 🧒" },
  { key: "watch", label: "watched 👀" },
  { key: "lens1", label: "lens 1 · play" },
  { key: "lens2", label: "lens 2 · mechanics" },
  { key: "lens3", label: "lens 3 · justice" },
  { key: "lens4", label: "lens 4 · aliveness" },
];

export function layerScore(layer: Layer, a: RawAnswers): number | null {
  return scoreLayer(layer, a);
}

/* ── matrix fields (the per-playdate roll-up) ───────────────── */

export function accessPass(a: RawAnswers): boolean | null {
  const v = a["c-l3-access"];
  if (v === undefined) return null;
  return v === "yes";
}

export function layer3Door(a: RawAnswers): string | null {
  const v = a["c-l3-door"];
  return typeof v === "string" ? v : null;
}

export function widenPass(a: RawAnswers): boolean | null {
  const v = a["c-l4-widen"];
  if (v === undefined) return null;
  return v === "yes";
}

export function coherenceRaw(a: RawAnswers): number | null {
  const v = a["c-l4-creaseworks"];
  return typeof v === "number" ? v : null;
}

export function verdictCall(a: RawAnswers): string | null {
  const v = a["c-verdict"];
  return typeof v === "string" ? v : null;
}
