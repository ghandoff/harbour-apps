/**
 * creaseworks eval — scoring.
 *
 * Turns a submission's raw answers into per-cascade-layer health scores
 * (0–1) and the collection-matrix fields jamie's brief calls for. Kept
 * separate from the rubric and the dashboard so it can be unit-tested.
 *
 * A layer score is the mean of its present, scorable items — unanswered
 * items are skipped, never counted as zero, so a partial review isn't
 * punished for being partial.
 */

export type RawAnswers = Record<string, number | string | string[]>;

/* ── per-item normalisers (→ 0..1, or null when absent/unscorable) ── */

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

/* ── per-layer scores ───────────────────────────────────────── */

export function feltScore(a: RawAnswers): number | null {
  return mean([s5(a["felt-arrived"]), s5(a["felt-surprise"]), s5(a["felt-keepgoing"]), s5rev(a["felt-test"])]);
}

export function briefScore(a: RawAnswers): number | null {
  return mean([
    gate(a["brief-l1"]),
    gate(a["brief-l2"]),
    doorScore(a["brief-l3"]),
    yn(a["brief-dig-player"]),
    yn(a["brief-dig-facilitator"]),
    yn(a["brief-conditions"]),
    yn(a["brief-samematerial"]),
  ]);
}

export function frameworkScore(a: RawAnswers): number | null {
  return mean([
    gate(a["fw-floor-stakes"]),
    gate(a["fw-floor-surprise"]),
    gate(a["fw-floor-messy"]),
    gate(a["fw-floor-hopeful"]),
    yn(a["fw-gate-essential"]),
    yn(a["fw-gate-routes"]),
    yn(a["fw-gate-reachable"]),
    yn(a["fw-lever-conditions"]),
    yn(a["fw-lever-error"]),
    yn(a["fw-lever-noverdict"]),
    yn(a["fw-lever-heighten"]),
    yn(a["fw-lever-stakes"]),
    yn(a["fw-lever-relationships"]),
    yn(a["fw-lever-cannot"]),
    yn(a["fw-lever-defaultplayer"]),
    decisiveScore(a["fw-decisive"]),
    yn(a["fw-guard-conditions"]),
    yn(a["fw-guard-adapt"]),
    yn(a["fw-guard-agency"]),
    yn(a["fw-guard-justice"]),
    yn(a["fw-guard-overclaim"]),
    yn(a["fw-guard-traces"]),
    yn(a["fw-guard-scale"]),
    redflagScore(a["fw-guard-redflags"]),
    yn(a["fw-guard-indicators"]),
  ]);
}

export function foundationScore(a: RawAnswers): number | null {
  const triad = Array.isArray(a["fnd-triad"]) ? a["fnd-triad"].length / 3 : null;
  return mean([yn(a["fnd-chain"]), triad]);
}

/* ── matrix fields (jamie's collection matrix) ──────────────── */

/** the no-default-player HARD gate: passes only if all three are yes. */
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
  const guard = a["fw-guard-justice"];
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

/** the single decisive verdict, mapped to a label. */
export function decisiveVerdict(a: RawAnswers): string | null {
  const v = a["fw-decisive"];
  return typeof v === "string" ? v : null;
}
