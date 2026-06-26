/**
 * creaseworks-eval — the rubric (question bank).
 *
 * This is the design cascade, run in reverse. Designing a game flows DOWN
 * the cascade (theory → manifesto → framework → brief → card); evaluating
 * one climbs UP. Every item below is lifted from jamie's Games Design
 * Framework and the Creaseworks design brief, and worded as a CONDITION
 * present, never an OUTCOME achieved — the one rule the whole framework
 * exists to protect.
 *
 * Two registers map onto where an evaluator enters the cascade:
 *   felt   — friends & family who PLAYED it. The bottom layer only,
 *            in plain language.
 *   frame  — the collective, climbing the whole cascade against the
 *            framework instruments.
 *
 * Sources (read 26 june 2026):
 *   • winded.vertigo — Games Design Framework (the 6-stage spine)
 *   • creaseworks design brief (the instance: 3 layers, two-face dig,
 *     conditions not outcomes)
 */

export type Register = "felt" | "frame";

/** the cascade layers, bottom → top (the order an evaluation climbs). */
export type Layer = "cards" | "brief" | "framework" | "foundation" | "verdict";

export type ItemType =
  | "scale5" // 1–5 likert
  | "gate3" // clear / partial / blocked (the floor scale)
  | "yesno" // yes / no / unsure
  | "choice" // single pick from `options`
  | "triad" // play / justice / aliveness — mark each present
  | "text"; // free response

export interface EvalItem {
  id: string;
  layer: Layer;
  registers: Register[]; // who sees it
  prompt: string;
  /** the framework source / clarifier, shown small under the prompt. */
  help?: string;
  type: ItemType;
  options?: string[];
  /** scale5 where a HIGH answer is bad (e.g. "felt like a test"). */
  reverse?: boolean;
}

export interface LayerMeta {
  key: Layer;
  label: string;
  blurb: string;
}

/* ── the cascade layers (bottom → top) ──────────────────────── */

export const LAYERS: LayerMeta[] = [
  {
    key: "cards",
    label: "the felt play",
    blurb: "what it was actually like to play. anyone who played can answer this.",
  },
  {
    key: "brief",
    label: "the creaseworks brief",
    blurb: "the three layers, the two-face dig, conditions not outcomes.",
  },
  {
    key: "framework",
    label: "the games design framework",
    blurb: "the floor, the no-default-player gate, the lever, the decisive test, the guards.",
  },
  {
    key: "foundation",
    label: "manifesto & theory of change",
    blurb: "does the mechanic chain back to play, justice and aliveness?",
  },
  {
    key: "verdict",
    label: "the verdict",
    blurb: "where this playdate lands.",
  },
];

/* ── the playdates under evaluation (the 5 mini pilot activities) ── */

export interface EvalPlaydate {
  slug: string;
  title: string;
  tagline: string;
}

export const EVAL_PLAYDATES: EvalPlaydate[] = [
  {
    slug: "character-from-a-crease",
    title: "character from a crease",
    tagline: "fold paper and let the creases tell you who lives inside",
  },
  {
    slug: "function-swap-same-form",
    title: "function swap, same form",
    tagline: "keep the same stuff — change what it's for",
  },
  {
    slug: "design-a-rule-not-an-object",
    title: "design a rule, not an object",
    tagline: "invent a rule that changes how things work",
  },
  {
    slug: "take-apart-archaeology",
    title: "take-apart archaeology",
    tagline: "open a broken thing and discover what's inside",
  },
  {
    slug: "mend-a-stuffed-friend",
    title: "mend a stuffed friend",
    tagline: "fix a torn toy and learn the superpower of repair",
  },
];

export function playdateBySlug(slug: string): EvalPlaydate | undefined {
  return EVAL_PLAYDATES.find((p) => p.slug === slug);
}

/* ── shared option sets ─────────────────────────────────────── */

export const GATE3_OPTIONS = ["clear", "partial", "blocked"] as const;
export const YESNO_OPTIONS = ["yes", "no", "unsure"] as const;
export const DOOR_OPTIONS = ["yes — a real door", "light — only hinted", "no"] as const;

/* ── the items ──────────────────────────────────────────────── */

export const ITEMS: EvalItem[] = [
  /* ===== LAYER: cards & sessions — the felt play (FELT + FRAME) ===== */
  {
    id: "felt-arrived",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "did it feel like play actually happened — not a task to get through?",
    type: "scale5",
  },
  {
    id: "felt-quickstart",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "could you start in about two minutes, with stuff you already had?",
    help: "the floor — low stakes, ready in under two minutes.",
    type: "yesno",
  },
  {
    id: "felt-surprise",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "was there a “huh, i didn't expect that” moment?",
    help: "metabolisable surprise — it stretched without shattering.",
    type: "scale5",
  },
  {
    id: "felt-test",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "how much did it feel like there was a right answer, or like you were being tested?",
    help: "no verdict on the player — lower is better here.",
    type: "scale5",
    reverse: true,
  },
  {
    id: "felt-keepgoing",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "did you want to keep going, or try it on something else?",
    help: "the return that travels — it followed you out of the box.",
    type: "scale5",
  },
  {
    id: "felt-linger",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "did you feel you had to do the steps in order, or could you linger and jump around?",
    help: "non-linearity — play should follow the player's lead, not a fixed sequence.",
    type: "choice",
    options: ["had to follow the order", "somewhere in between", "could linger / jump freely"],
  },
  {
    id: "felt-notes",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "where did it sing? where did it sag?",
    type: "text",
  },

  /* ===== LAYER: the creaseworks brief (FRAME) ===== */
  {
    id: "brief-l1",
    layer: "brief",
    registers: ["frame"],
    prompt: "layer 1 — is there immediate, low-stakes surface play with everyday materials and no correct answer?",
    help: "the entry. ready in under two minutes.",
    type: "gate3",
  },
  {
    id: "brief-l2",
    layer: "brief",
    registers: ["frame"],
    prompt: "layer 2 — does it reveal the object isn't what it seemed (the model shift)?",
    help: "“our models are constructed not given”, enacted rather than explained.",
    type: "gate3",
  },
  {
    id: "brief-l3",
    layer: "brief",
    registers: ["frame"],
    prompt: "layer 3 — is there a door to the wider world the object comes from (the deeper connection)?",
    help: "the layer most absent from the current collection — the bottle cap → factory → forest → water.",
    type: "choice",
    options: ["yes — a real door", "light — only hinted", "no"],
  },
  {
    id: "brief-dig-player",
    layer: "brief",
    registers: ["frame"],
    prompt: "two-face dig — is there one open question for the player at the end (a door left ajar, not a lesson or comprehension check)?",
    type: "yesno",
  },
  {
    id: "brief-dig-facilitator",
    layer: "brief",
    registers: ["frame"],
    prompt: "two-face dig — is the theory carried in a separate facilitator face, kept off the child-facing card?",
    help: "the facilitator face carries the theory so the child card doesn't have to — the answer to playwashing.",
    type: "yesno",
  },
  {
    id: "brief-conditions",
    layer: "brief",
    registers: ["frame"],
    prompt: "conditions not outcomes — does the child-facing card avoid naming what the child “learns” or “practises”?",
    help: "the what-kids-practise tags are the clearest place creaseworks falls off its own floor.",
    type: "yesno",
  },
  {
    id: "brief-samematerial",
    layer: "brief",
    registers: ["frame"],
    prompt: "find again — is it a true “same material, new function” shift, not “same build, new constraint” / “now make it harder” drift?",
    type: "yesno",
  },
  {
    id: "brief-notes",
    layer: "brief",
    registers: ["frame"],
    prompt: "notes on the three layers and the dig.",
    type: "text",
  },

  /* ===== LAYER: the games design framework (FRAME) ===== */
  /* the floor — four qualities, each clear / partial / blocked */
  {
    id: "fw-floor-stakes",
    layer: "framework",
    registers: ["frame"],
    prompt: "the floor · low stakes — errors don't cascade, nobody's in survival mode, the danger is held not absent.",
    type: "gate3",
  },
  {
    id: "fw-floor-surprise",
    layer: "framework",
    registers: ["frame"],
    prompt: "the floor · metabolisable surprise — prediction error that stretches without shattering, bounded and recoverable.",
    type: "gate3",
  },
  {
    id: "fw-floor-messy",
    layer: "framework",
    registers: ["frame"],
    prompt: "the floor · messy & non-performative — no correct output and no audience.",
    help: "a timer, a score, a watching crowd or an outcome tag pulls a game part-way off this rung.",
    type: "gate3",
  },
  {
    id: "fw-floor-hopeful",
    layer: "framework",
    registers: ["frame"],
    prompt: "the floor · implicitly hopeful — the next move feels possible, the loop stays open after error.",
    type: "gate3",
  },
  /* the no-default-player gate — HARD gate */
  {
    id: "fw-gate-essential",
    layer: "framework",
    registers: ["frame"],
    prompt: "hard gate — is the essential experience named in one sentence, stripped of its default sensory / physical / linguistic form?",
    help: "not “draw a character from creases”, but “discover that a material trace can suggest a form you didn't invent from nothing”.",
    type: "yesno",
  },
  {
    id: "fw-gate-routes",
    layer: "framework",
    registers: ["frame"],
    prompt: "hard gate — are there at least three genuine routes into that essential experience?",
    type: "yesno",
  },
  {
    id: "fw-gate-reachable",
    layer: "framework",
    registers: ["frame"],
    prompt: "hard gate — could a blind, a limited-motor, and a non-reading player each reach the same essential experience, no route framed as a lesser version?",
    type: "yesno",
  },
  /* the lever — 8 principles, each its practical test (verbatim) */
  {
    id: "fw-lever-conditions",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — can a player go somewhere you didn't anticipate and still have a valid experience?",
    help: "design the conditions, not the play.",
    type: "yesno",
  },
  {
    id: "fw-lever-error",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — does failure generate something useful rather than a dead end?",
    help: "error is information.",
    type: "yesno",
  },
  {
    id: "fw-lever-noverdict",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — could a player be wrong here and feel curiosity rather than shame, with no one ranked against the result?",
    help: "no verdict on the player.",
    type: "yesno",
  },
  {
    id: "fw-lever-heighten",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — is there a lower-intensity path that doesn't feel like failure?",
    help: "heighten, then hold.",
    type: "yesno",
  },
  {
    id: "fw-lever-stakes",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — would a person in a high-stakes frame feel safe being wrong here?",
    help: "stakes are structural.",
    type: "yesno",
  },
  {
    id: "fw-lever-relationships",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — does the game get better when people think together?",
    help: "thinking in relationships.",
    type: "yesno",
  },
  {
    id: "fw-lever-cannot",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — can you name a specific person who cannot access this, and the barrier?",
    help: "name what it cannot do.",
    type: "yesno",
  },
  {
    id: "fw-lever-defaultplayer",
    layer: "framework",
    registers: ["frame"],
    prompt: "lever — after the lever work, does the no-default-player gate still hold?",
    type: "yesno",
  },
  /* the decisive test — the single question that separates a w.v game from a merely fun one */
  {
    id: "fw-decisive",
    layer: "framework",
    registers: ["frame"],
    prompt: "the decisive test — does what happened return in a form that travels, and did the field of possible action widen?",
    help: "or did it only manufacture local engagement? if the floor is met and this is not, you have a fun game, not a winded.vertigo one.",
    type: "choice",
    options: ["return travels & field widens", "partial", "fun only — no return that travels"],
  },
  /* the guards — commercial integrity test (7 rows) */
  {
    id: "fw-guard-conditions",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — does it create conditions for play, rather than claim to produce transformation?",
    help: "protects against salvation-selling.",
    type: "yesno",
  },
  {
    id: "fw-guard-adapt",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — can it be adapted locally?",
    help: "protects against rigid replication.",
    type: "yesno",
  },
  {
    id: "fw-guard-agency",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — does it preserve agency for facilitators and players?",
    help: "protects against installable-capacity logic.",
    type: "yesno",
  },
  {
    id: "fw-guard-justice",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — is there a justice access route?",
    help: "protects against play becoming privilege.",
    type: "yesno",
  },
  {
    id: "fw-guard-overclaim",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — does the framing avoid overclaiming outcomes?",
    help: "protects against becoming a bad evidence generator with our name on it.",
    type: "yesno",
  },
  {
    id: "fw-guard-traces",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — does it keep traces of process, not only a polished surface?",
    help: "protects against betraying the theory's epistemology.",
    type: "yesno",
  },
  {
    id: "fw-guard-scale",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — is it honest about who benefits financially from its scale?",
    help: "protects against extraction wearing regeneration's clothes.",
    type: "yesno",
  },
  /* red flags + indicator discipline */
  {
    id: "fw-guard-redflags",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — any red-flag mechanics present?",
    help: "leaderboards, elimination, timed pressure, public scoring, correct-answer reveals, single-channel mechanics…",
    type: "choice",
    options: ["none", "one or two", "several"],
  },
  {
    id: "fw-guard-indicators",
    layer: "framework",
    registers: ["frame"],
    prompt: "guard — if success is named at all, is there at least one justice indicator and one negative indicator?",
    help: "an evaluation with neither is performance, never learning.",
    type: "yesno",
  },
  {
    id: "fw-notes",
    layer: "framework",
    registers: ["frame"],
    prompt: "notes on the floor / gate / lever / decisive test / guards.",
    type: "text",
  },

  /* ===== LAYER: manifesto & theory of change (FRAME) ===== */
  {
    id: "fnd-chain",
    layer: "foundation",
    registers: ["frame"],
    prompt: "coherence chain — does it complete for the main mechanic? (mechanic → condition → manifesto principle → theory-of-change link → outcome direction → brief question)",
    type: "yesno",
  },
  {
    id: "fnd-triad",
    layer: "foundation",
    registers: ["frame"],
    prompt: "the triad — which of these live here concretely (not as decoration)?",
    help: "mark each that is genuinely present.",
    type: "triad",
    options: ["play", "justice", "aliveness"],
  },
  {
    id: "fnd-gravity",
    layer: "foundation",
    registers: ["frame"],
    prompt: "the gravity guard — what does the theory help us see here, and what might it be making harder to see?",
    type: "text",
  },

  /* ===== LAYER: the verdict (FRAME) ===== */
  {
    id: "verdict-call",
    layer: "verdict",
    registers: ["frame"],
    prompt: "the call for this playdate.",
    type: "choice",
    options: ["keep", "strengthen", "redesign", "remove"],
  },
  {
    id: "verdict-coherence",
    layer: "verdict",
    registers: ["frame"],
    prompt: "how coherent is this as a *creaseworks* activity — vs a wrapper around a generic game?",
    type: "scale5",
  },
  {
    id: "verdict-final",
    layer: "verdict",
    registers: ["felt", "frame"],
    prompt: "anything else for the team?",
    type: "text",
  },
];

/* ── helpers ────────────────────────────────────────────────── */

/** items a given register sees, in cascade-climb order. */
export function itemsFor(register: Register): EvalItem[] {
  return ITEMS.filter((it) => it.registers.includes(register));
}

/** layers a given register touches, in climb order, with their items. */
export function layersFor(register: Register): { meta: LayerMeta; items: EvalItem[] }[] {
  return LAYERS.map((meta) => ({
    meta,
    items: itemsFor(register).filter((it) => it.layer === meta.key),
  })).filter((group) => group.items.length > 0);
}

export const REGISTER_META: Record<Register, { label: string; sub: string; emoji: string }> = {
  felt: {
    label: "i played it",
    sub: "friends & family — a few quick questions about what it was like",
    emoji: "🌿",
  },
  frame: {
    label: "i'm reviewing it",
    sub: "the collective — climb the cascade against the framework",
    emoji: "🧭",
  },
};
