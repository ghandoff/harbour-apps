/**
 * creaseworks-eval — the rubric (question bank), faceted as jamie's lenses.
 *
 * Wednesday's "felt session" tool organises the framework into five
 * LENSES. We adopt that vocabulary verbatim — the team already thinks in
 * it — and run it as the async twin of the live session. The shape:
 *
 *   the felt play   — what it was like (everyone; the universal opening)
 *   lens 1          — the play condition (the floor)
 *   lens 2          — the mechanics (the lever + KEK return)
 *   lens 3          — justice and access (who the design lets in)
 *   lens 4          — aliveness and coherence (the decisive test)
 *   lens 5          — what the documents failed to see (the room outranks the page)
 *   the verdict
 *   redesign        — rebuild it from what you felt (eval → design)
 *
 * Salience-first: mark only what feels salient — never fill it like
 * homework. Unanswered items are skipped in scoring, never counted zero.
 *
 * Two registers map to where you enter: felt (friends & family, the felt
 * play only) and frame (the collective, the whole climb). Every item is
 * lifted from the Games Design Framework + Creaseworks brief, worded as a
 * condition present, never an outcome achieved.
 */

export type Register = "felt" | "frame";

export type Layer =
  | "cards"
  | "lens1"
  | "lens2"
  | "lens3"
  | "lens4"
  | "lens5"
  | "verdict"
  | "redesign";

export type ItemType = "scale5" | "gate3" | "yesno" | "choice" | "triad" | "text";

export interface EvalItem {
  id: string;
  layer: Layer;
  registers: Register[];
  prompt: string;
  help?: string;
  type: ItemType;
  options?: string[];
  reverse?: boolean; // scale5 where a HIGH answer is bad
}

export interface LayerMeta {
  key: Layer;
  label: string;
  blurb: string;
  /** lenses that carry a 0–1 health score in the dashboard heatmap. */
  scored?: boolean;
}

/* ── the lenses (bottom → top), blurbs verbatim from the felt-session app ── */

export const LAYERS: LayerMeta[] = [
  {
    key: "cards",
    label: "the felt play",
    blurb: "what it was actually like to play. feel it before you frame it — anyone who played can answer this.",
    scored: true,
  },
  {
    key: "lens1",
    label: "lens 1 · the play condition",
    blurb: "the floor. this is not the easy rung, it is often where games fail. clearing it only means a game may invite play, it does not yet say it is one of ours.",
    scored: true,
  },
  {
    key: "lens2",
    label: "lens 2 · the mechanics",
    blurb: "the lever — the design work, where the difference from a fun game becomes visible. the eight principles and the KEK arc with its return. mark the ones that feel salient.",
    scored: true,
  },
  {
    key: "lens3",
    label: "lens 3 · justice and access",
    blurb: "not who happened to be good at it, but whether the design lets many kinds of people in. decided at the design table, not at the point of sale.",
    scored: true,
  },
  {
    key: "lens4",
    label: "lens 4 · aliveness and coherence",
    blurb: "the decisive test. did it widen what you feel able to do, and was it more than just engaging in the moment? and does the mechanic still chain back to the theory?",
    scored: true,
  },
  {
    key: "lens5",
    label: "lens 5 · what the documents failed to see",
    blurb: "where the framework had no language for what you felt, where it misled you, where the game was richer or worse than it could account for. this is how the room outranks the page.",
  },
  {
    key: "verdict",
    label: "the verdict",
    blurb: "where this playdate lands.",
  },
  {
    key: "redesign",
    label: "redesign — rebuild from what you felt",
    blurb: "not how to make it more fun. work from what you felt playing it. optional — skip if you're only here to evaluate.",
  },
];

/* ── the playdates under evaluation (the 5 mini pilot activities) ── */

export interface EvalPlaydate {
  slug: string;
  title: string;
  tagline: string;
  /** a short essence of the activity, fed to the AI one-read. */
  content: string;
}

export const EVAL_PLAYDATES: EvalPlaydate[] = [
  {
    slug: "character-from-a-crease",
    title: "character from a crease",
    tagline: "fold paper and let the creases tell you who lives inside",
    content:
      "fold paper, find a face or creature hiding in the creases, draw it in and give it a name; refold to hide or reveal it. find again: characters hide in cracks, wood grain, clouds.",
  },
  {
    slug: "function-swap-same-form",
    title: "function swap, same form",
    tagline: "keep the same stuff — change what it's for",
    content:
      "gather 10–15 similar small objects; do three rounds with the same pieces under different missions — tell a story, organise them, explain something. same material, new function.",
  },
  {
    slug: "design-a-rule-not-an-object",
    title: "design a rule, not an object",
    tagline: "invent a rule that changes how things work",
    content:
      "invent one rule that changes how ordinary objects behave (e.g. only move things by blowing); play it; then rewrite it simpler so anyone can learn it in under 30 seconds.",
  },
  {
    slug: "take-apart-archaeology",
    title: "take-apart archaeology",
    tagline: "open a broken thing and discover what's inside",
    content:
      "with permission and safety, open a broken device; lay out the parts; work out what each one does; map how they worked together; recombine the parts into something new.",
  },
  {
    slug: "mend-a-stuffed-friend",
    title: "mend a stuffed friend",
    tagline: "fix a torn toy and learn the superpower of repair",
    content:
      "find a torn stuffed toy; sew the rip with visible colourful thread (a 'cool scar', kintsugi); restuff it; the repair tells a story. mending works on everything.",
  },
];

export function playdateBySlug(slug: string): EvalPlaydate | undefined {
  return EVAL_PLAYDATES.find((p) => p.slug === slug);
}

/* ── shared option sets ─────────────────────────────────────── */

export const GATE3_OPTIONS = ["clear", "partial", "blocked"] as const;
export const YESNO_OPTIONS = ["yes", "no", "unsure"] as const;

/* ── the items ──────────────────────────────────────────────── */

export const ITEMS: EvalItem[] = [
  /* ===== the felt play (FELT + FRAME) — feel it before you frame it ===== */
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
    type: "yesno",
  },
  {
    id: "felt-surprise",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "was there a “huh, i didn't expect that” moment?",
    type: "scale5",
  },
  {
    id: "felt-test",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "how much did it feel like there was a right answer, or like you were being tested?",
    help: "lower is better — no verdict on the player.",
    type: "scale5",
    reverse: true,
  },
  {
    id: "felt-keepgoing",
    layer: "cards",
    registers: ["felt", "frame"],
    prompt: "afterwards, did the range of things you felt able to do feel wider, or narrower?",
    help: "the widening — did you want to keep going, or try it on something else?",
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

  /* ===== lens 1 · the play condition — the floor (FRAME) ===== */
  {
    id: "fw-floor-stakes",
    layer: "lens1",
    registers: ["frame"],
    prompt: "low stakes — consequence-reduced, not trivial. errors don't cascade, nobody is in survival mode.",
    type: "gate3",
  },
  {
    id: "fw-floor-surprise",
    layer: "lens1",
    registers: ["frame"],
    prompt: "metabolisable surprise — prediction error that stretches without shattering.",
    type: "gate3",
  },
  {
    id: "fw-floor-messy",
    layer: "lens1",
    registers: ["frame"],
    prompt: "messy & non-performative — no correct output and no audience to satisfy.",
    help: "a timer, a score, a watching crowd or an outcome tag pulls a game part-way off this rung.",
    type: "gate3",
  },
  {
    id: "fw-floor-hopeful",
    layer: "lens1",
    registers: ["frame"],
    prompt: "implicitly hopeful — acting as if the next move can land, the loop staying open after error.",
    type: "gate3",
  },

  /* ===== lens 2 · the mechanics — the lever + KEK return (FRAME) ===== */
  {
    id: "brief-l1",
    layer: "lens2",
    registers: ["frame"],
    prompt: "layer 1 — immediate, low-stakes surface play with everyday materials and no correct answer.",
    type: "gate3",
  },
  {
    id: "brief-l2",
    layer: "lens2",
    registers: ["frame"],
    prompt: "layer 2 — it reveals the object isn't what it seemed (the model shift).",
    type: "gate3",
  },
  {
    id: "brief-samematerial",
    layer: "lens2",
    registers: ["frame"],
    prompt: "the return (KEK) — a true “same material, new function” shift, not “same build, new constraint” / “now make it harder” drift.",
    type: "yesno",
  },
  {
    id: "brief-dig-player",
    layer: "lens2",
    registers: ["frame"],
    prompt: "the two-face dig — one open question for the player at the end (a door left ajar, not a lesson or comprehension check).",
    type: "yesno",
  },
  {
    id: "brief-dig-facilitator",
    layer: "lens2",
    registers: ["frame"],
    prompt: "the theory is carried in a separate facilitator face, kept off the child-facing card.",
    type: "yesno",
  },
  {
    id: "brief-conditions",
    layer: "lens2",
    registers: ["frame"],
    prompt: "conditions not outcomes — the child card avoids naming what the child “learns” or “practises”.",
    type: "yesno",
  },
  {
    id: "fw-lever-conditions",
    layer: "lens2",
    registers: ["frame"],
    prompt: "design the conditions, not the play — a player can go somewhere you didn't anticipate and still have a valid experience.",
    type: "yesno",
  },
  {
    id: "fw-lever-error",
    layer: "lens2",
    registers: ["frame"],
    prompt: "error is information — a mistake reveals or unlocks something, never just a dead end.",
    type: "yesno",
  },
  {
    id: "fw-lever-noverdict",
    layer: "lens2",
    registers: ["frame"],
    prompt: "no verdict on the player — a player could be wrong and feel curiosity rather than shame, no one ranked against the result.",
    type: "yesno",
  },
  {
    id: "fw-lever-heighten",
    layer: "lens2",
    registers: ["frame"],
    prompt: "heighten, then hold — there is a lower-intensity path that doesn't feel like failure.",
    type: "yesno",
  },
  {
    id: "fw-lever-stakes",
    layer: "lens2",
    registers: ["frame"],
    prompt: "stakes are structural — someone in a high-stakes frame would feel safe being wrong here.",
    type: "yesno",
  },
  {
    id: "fw-lever-relationships",
    layer: "lens2",
    registers: ["frame"],
    prompt: "thinking in relationships — the game gets better when people think together.",
    type: "yesno",
  },
  {
    id: "fw-guard-redflags",
    layer: "lens2",
    registers: ["frame"],
    prompt: "red-flag mechanics present?",
    help: "leaderboards, elimination, timed pressure, public scoring, correct-answer reveals, single-channel mechanics…",
    type: "choice",
    options: ["none", "one or two", "several"],
  },
  {
    id: "brief-notes",
    layer: "lens2",
    registers: ["frame"],
    prompt: "notes on the mechanics.",
    type: "text",
  },

  /* ===== lens 3 · justice and access (FRAME) ===== */
  {
    id: "fw-gate-essential",
    layer: "lens3",
    registers: ["frame"],
    prompt: "the essential experience is named in one sentence, stripped of its default sensory / physical / linguistic form.",
    help: "not “draw a character from creases”, but “discover that a material trace can suggest a form you didn't invent from nothing”.",
    type: "yesno",
  },
  {
    id: "fw-gate-routes",
    layer: "lens3",
    registers: ["frame"],
    prompt: "at least three genuine routes into that essential experience.",
    type: "yesno",
  },
  {
    id: "fw-gate-reachable",
    layer: "lens3",
    registers: ["frame"],
    prompt: "a blind, a limited-motor, and a non-reading player could each reach the same experience — no route framed as a lesser version.",
    help: "the no-default-player gate. run it before any redesign.",
    type: "yesno",
  },
  {
    id: "brief-l3",
    layer: "lens3",
    registers: ["frame"],
    prompt: "layer 3 — a door to the wider world the object comes from (the deeper connection / the justice angle).",
    help: "the layer most absent from the current collection — the bottle cap → factory → forest → water.",
    type: "choice",
    options: ["yes — a real door", "light — only hinted", "no"],
  },
  {
    id: "fw-guard-adapt",
    layer: "lens3",
    registers: ["frame"],
    prompt: "it can be adapted locally (vs rigid replication).",
    type: "yesno",
  },
  {
    id: "fw-guard-scale",
    layer: "lens3",
    registers: ["frame"],
    prompt: "honest about who benefits financially from its scale (vs extraction in regeneration's clothes).",
    type: "yesno",
  },

  /* ===== lens 4 · aliveness and coherence — the decisive test (FRAME) ===== */
  {
    id: "fw-decisive",
    layer: "lens4",
    registers: ["frame"],
    prompt: "the decisive test — does what happened return in a form that travels, and did the field of possible action widen?",
    help: "or did it only manufacture local engagement? if the floor is met and this is not, you have a fun game, not a winded.vertigo one.",
    type: "choice",
    options: ["return travels & field widens", "partial", "fun only — no return that travels"],
  },
  {
    id: "fnd-chain",
    layer: "lens4",
    registers: ["frame"],
    prompt: "the coherence chain completes for the main mechanic. (mechanic → condition → principle → theory-of-change link → outcome direction → brief question)",
    type: "yesno",
  },
  {
    id: "fnd-triad",
    layer: "lens4",
    registers: ["frame"],
    prompt: "which of the triad live here concretely (not as decoration)?",
    type: "triad",
    options: ["play", "justice", "aliveness"],
  },
  {
    id: "fw-guard-conditions",
    layer: "lens4",
    registers: ["frame"],
    prompt: "it creates conditions for play, rather than claiming to produce transformation (vs salvation-selling).",
    type: "yesno",
  },
  {
    id: "fw-guard-overclaim",
    layer: "lens4",
    registers: ["frame"],
    prompt: "the framing avoids overclaiming outcomes (vs a bad evidence generator with our name on it).",
    type: "yesno",
  },
  {
    id: "fw-guard-traces",
    layer: "lens4",
    registers: ["frame"],
    prompt: "it keeps traces of process, not only a polished surface (vs betraying the theory's epistemology).",
    type: "yesno",
  },
  {
    id: "fw-guard-indicators",
    layer: "lens4",
    registers: ["frame"],
    prompt: "if success is named at all, there is at least one justice indicator and one negative indicator.",
    help: "an evaluation with neither is performance, never learning.",
    type: "yesno",
  },
  {
    id: "fnd-gravity",
    layer: "lens4",
    registers: ["frame"],
    prompt: "the gravity guard — what does the theory help us see here, and what might it be making harder to see?",
    type: "text",
  },

  /* ===== lens 5 · what the documents failed to see (FRAME, NEW) ===== */
  {
    id: "lens5-capture",
    layer: "lens5",
    registers: ["frame"],
    prompt: "how well did the framework capture what you actually felt playing this?",
    help: "low = the page missed the room.",
    type: "scale5",
  },
  {
    id: "lens5-nolang",
    layer: "lens5",
    registers: ["frame"],
    prompt: "where did the framework have no language for what you felt?",
    type: "text",
  },
  {
    id: "lens5-misled",
    layer: "lens5",
    registers: ["frame"],
    prompt: "where did it mislead you — the game richer or worse than the rubric could account for?",
    type: "text",
  },

  /* ===== the verdict (FRAME) ===== */
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

  /* ===== redesign — rebuild from what you felt (FRAME, NEW) ===== */
  {
    id: "redesign-stakes",
    layer: "redesign",
    registers: ["frame"],
    prompt: "where might the stakes be accidentally too high?",
    type: "text",
  },
  {
    id: "redesign-flat",
    layer: "redesign",
    registers: ["frame"],
    prompt: "where might the uncertainty be too flat, or too much?",
    type: "text",
  },
  {
    id: "redesign-hidden",
    layer: "redesign",
    registers: ["frame"],
    prompt: "where might there be a hidden correct answer?",
    type: "text",
  },
  {
    id: "redesign-routes",
    layer: "redesign",
    registers: ["frame"],
    prompt: "what routes through could multiply?",
    type: "text",
  },
  {
    id: "redesign-direction",
    layer: "redesign",
    registers: ["frame"],
    prompt: "one redesign direction you'd try.",
    type: "text",
  },
];

/* ── helpers ────────────────────────────────────────────────── */

export function itemsFor(register: Register): EvalItem[] {
  return ITEMS.filter((it) => it.registers.includes(register));
}

export function layersFor(register: Register): { meta: LayerMeta; items: EvalItem[] }[] {
  return LAYERS.map((meta) => ({
    meta,
    items: itemsFor(register).filter((it) => it.layer === meta.key),
  })).filter((group) => group.items.length > 0);
}

export function itemById(id: string): EvalItem | undefined {
  return ITEMS.find((it) => it.id === id);
}

export const REGISTER_META: Record<Register, { label: string; sub: string; emoji: string }> = {
  felt: {
    label: "i played it",
    sub: "friends & family — a few quick questions about what it was like",
    emoji: "🌿",
  },
  frame: {
    label: "i'm reviewing it",
    sub: "the collective — climb the five lenses against the framework",
    emoji: "🧭",
  },
};
