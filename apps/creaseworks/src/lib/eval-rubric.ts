/**
 * creaseworks-eval — the rubric (question bank), three registers.
 *
 * The tool matches the instrument to the human (research-backed redesign,
 * 2026-06-26):
 *   kid        — the player. ~5 items, all-positive faces / yes-maybe-no,
 *                concrete, asked right after play, a grown-up scribes.
 *   grownup    — the watcher. observe the child and tick what you SAW
 *                (Leuven involvement & well-being + LEGO's 5 characteristics
 *                + EYFS characteristics of effective learning).
 *   collective — the designer. jamie's 5 lenses, trimmed (~40→~15), plain,
 *                one idea per item, salience-first.
 *
 * Kid self-report and grown-up observation are SEPARATE submissions, never
 * pooled — they measure different things and diverge by design.
 *
 * Sources: Fun Toolkit / Smileyometer (Read & MacFarlane); Five Degrees of
 * Happiness (Hall et al. 2016); Leuven scales (Laevers); LEGO Foundation
 * Learning-through-Play; EYFS CoEL; Coombes 2021; Mellor & Moore 2014.
 */

export type Register = "kid" | "grownup" | "collective";

export type Layer =
  | "intent"
  | "kid"
  | "watch"
  | "lens1"
  | "lens2"
  | "lens3"
  | "lens4"
  | "lens5"
  | "verdict"
  | "redesign";

export type ItemType =
  | "faces" // kid: all-positive graded faces (options carry the labels)
  | "scale5" // 1–5 (collective + grown-up Leuven reads)
  | "gate3" // clear / partial / blocked (collective floor/mechanics)
  | "yesno" // yes / no / unsure (collective)
  | "choice" // single pick from options
  | "checklist" // multi-select (grown-up behaviours)
  | "text";

export interface EvalItem {
  id: string;
  layer: Layer;
  registers: Register[];
  prompt: string;
  help?: string;
  type: ItemType;
  options?: string[];
  reverse?: boolean;
  /**
   * Descriptive inventory item — excluded from the layer health score
   * (it counts what was present, it isn't a quality judgment). Still feeds
   * the roll-up + divergence. Default true (scored).
   */
  scored?: boolean;
}

export interface LayerMeta {
  key: Layer;
  label: string;
  blurb: string;
}

/* ── layers (display order) ─────────────────────────────────── */

export const LAYERS: LayerMeta[] = [
  { key: "intent", label: "first read", blurb: "before the lenses — your honest first take on what this game is reaching for. no wrong answers." },
  { key: "kid", label: "your turn!", blurb: "tap the answer that feels right. there are no wrong answers." },
  { key: "watch", label: "what you saw", blurb: "watch the child play, then tick what you actually saw them do — about the play, not a test of the child." },
  { key: "lens1", label: "lens 1 · the play condition", blurb: "the floor. clearing it only means a game may invite play — it doesn't yet make it one of ours." },
  { key: "lens2", label: "lens 2 · the mechanics", blurb: "the design work — where the difference from a merely fun game shows up. mark what's salient." },
  { key: "lens3", label: "lens 3 · justice & access", blurb: "whether the design lets many kinds of kids in — decided at the design table, not the point of sale." },
  { key: "lens4", label: "lens 4 · aliveness & coherence", blurb: "the decisive test: did it widen what you can do, and does it really belong to creaseworks?" },
  { key: "lens5", label: "lens 5 · what the framework missed", blurb: "where the page lost to the room — what you felt that the framework couldn't name." },
  { key: "verdict", label: "the verdict", blurb: "where this playdate lands." },
  { key: "redesign", label: "redesign (optional)", blurb: "rebuild from what you felt — skip if you're only here to evaluate." },
];

/* ── the playdates under evaluation (the 5 mini pilot activities) ── */

export interface EvalPlaydate {
  slug: string;
  title: string;
  tagline: string;
  content: string; // short essence, fed to the AI one-read
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
/** all-positive kid faces — kids won't use a negative end (Hall et al. 2016). */
export const FACE_EMOJI: Record<string, string> = {
  good: "🙂",
  great: "😀",
  "the best": "🤩",
};

/* ── the items ──────────────────────────────────────────────── */

export const ITEMS: EvalItem[] = [
  /* first read · the reviewer's unprimed take on the game's intent (asked
     before the lenses; unscored, surfaced qualitatively on the dashboard) */
  {
    id: "c-intent",
    layer: "intent",
    registers: ["collective"],
    prompt: "what do you think this game is trying to do?",
    help: "in your own words — your first read, before you climb the lenses.",
    type: "text",
  },
  /* ===== 🧒 the player (register kid) ===== */
  {
    id: "kid-fun",
    layer: "kid",
    registers: ["kid"],
    prompt: "how was it?",
    type: "faces",
    options: ["good", "great", "the best"],
  },
  {
    id: "kid-again",
    layer: "kid",
    registers: ["kid"],
    prompt: "want to do it again?",
    type: "choice",
    options: ["yes", "maybe", "no"],
  },
  {
    id: "kid-ownway",
    layer: "kid",
    registers: ["kid"],
    prompt: "could you do it your own way?",
    type: "choice",
    options: ["yes", "sort of", "no"],
  },
  {
    id: "kid-goldilocks",
    layer: "kid",
    registers: ["kid"],
    prompt: "was it too easy, just right, or too tricky?",
    type: "choice",
    options: ["too easy", "just right", "too tricky"],
  },
  {
    id: "kid-fav",
    layer: "kid",
    registers: ["kid"],
    prompt: "what was your favourite bit?",
    help: "grown-up: write down what they say, in their words.",
    type: "text",
  },

  /* ===== 👀 the grown-up (register grownup) — observe, don't quiz ===== */
  {
    id: "watch-saw",
    layer: "watch",
    registers: ["grownup"],
    prompt: "tick what you saw them do",
    help: "only what you actually saw — leave the rest blank.",
    type: "checklist",
    options: [
      "got really absorbed",
      "kept going after a mistake",
      "made it their own (own ideas, not copying)",
      "talked about what they were doing",
      "came back to it / didn't want to stop",
      "chose and led it themselves",
      "looked happy and at ease",
    ],
  },
  {
    id: "watch-involved",
    layer: "watch",
    registers: ["grownup"],
    prompt: "how deeply involved were they?",
    help: "1 = drifting / going through the motions · 5 = totally absorbed",
    type: "scale5",
  },
  {
    id: "watch-atease",
    layer: "watch",
    registers: ["grownup"],
    prompt: "how at-ease and happy did they seem?",
    help: "1 = tense or unsettled · 5 = relaxed and delighted",
    type: "scale5",
  },
  {
    id: "watch-flow",
    layer: "watch",
    registers: ["grownup"],
    prompt: "did they move through it freely, or feel pushed to do the steps in order?",
    type: "choice",
    options: ["moved freely", "a bit of both", "pushed through in order"],
  },
  {
    id: "watch-moment",
    layer: "watch",
    registers: ["grownup"],
    prompt: "one moment that stood out",
    type: "text",
  },

  /* ===== 🧭 the collective (register collective) — 5 lenses, trimmed & plain ===== */
  /* lens 1 · the play condition */
  {
    id: "c-l1-stakes",
    layer: "lens1",
    registers: ["collective"],
    prompt: "low stakes — a mistake costs nothing here; nobody's worried about getting it wrong.",
    type: "gate3",
  },
  {
    id: "c-l1-surprise",
    layer: "lens1",
    registers: ["collective"],
    prompt: "a surprise that stretched them without overwhelming.",
    type: "gate3",
  },
  {
    id: "c-l1-noperform",
    layer: "lens1",
    registers: ["collective"],
    prompt: "no right answer, and no audience to perform for.",
    help: "a timer, score, or watching crowd pulls a game off this rung.",
    type: "gate3",
  },
  {
    id: "c-l1-hopeful",
    layer: "lens1",
    registers: ["collective"],
    prompt: "hopeful loop — after something goes wrong or gets stuck, trying again still makes sense.",
    help: "blocked = a stall or mistake ends the play · clear = setbacks pull them back in for another go.",
    type: "gate3",
  },
  /* lens 2 · the mechanics */
  {
    id: "c-l2-modelshift",
    layer: "lens2",
    registers: ["collective"],
    prompt: "the object becomes something new — it's not what it first seemed.",
    type: "gate3",
  },
  {
    id: "c-l2-error",
    layer: "lens2",
    registers: ["collective"],
    prompt: "wrong moves still lead somewhere; being wrong brings no shame.",
    type: "yesno",
  },
  {
    id: "c-l2-return",
    layer: "lens2",
    registers: ["collective"],
    prompt: "they leave with something they can use again — same stuff, new idea.",
    type: "yesno",
  },
  {
    id: "c-l2-dig",
    layer: "lens2",
    registers: ["collective"],
    prompt: "it ends with one open question, not a lesson or a quiz.",
    type: "yesno",
  },
  /* lens 3 · justice & access */
  {
    // descriptive inventory (scored:false) — breadth of access, not a
    // quality judgment; feeds the roll-up "ways in" + divergence.
    id: "c-l3-routes",
    layer: "lens3",
    registers: ["collective"],
    prompt: "which ways into the activity were genuinely available this time?",
    help: "mark every route that was actually possible today — not what could be added later.",
    type: "checklist",
    options: [
      "sight",
      "touch",
      "voice",
      "gesture",
      "making",
      "shared description",
      "supported handling",
      "slower pace",
      "watching first",
      "another route",
    ],
    scored: false,
  },
  {
    id: "c-l3-equal",
    layer: "lens3",
    registers: ["collective"],
    prompt: "were the non-default ways in designed as full, equal ways to play?",
    help: "not an adaptation bolted on after the 'real' activity was already designed.",
    type: "choice",
    options: ["designed in as equal", "partly", "bolted on after"],
  },
  {
    id: "c-l3-door",
    layer: "lens3",
    registers: ["collective"],
    prompt: "it opens a door to the bigger world the object comes from.",
    help: "e.g. the bottle cap → a factory → a forest → water.",
    type: "choice",
    options: ["yes — a real door", "a little", "no"],
  },
  /* lens 4 · aliveness & coherence */
  {
    id: "c-l4-widen",
    layer: "lens4",
    registers: ["collective"],
    prompt: "it opened up more things to try, beyond just being fun in the moment.",
    type: "yesno",
  },
  {
    id: "c-l4-creaseworks",
    layer: "lens4",
    registers: ["collective"],
    prompt: "this clearly belongs to creaseworks — not a generic game with a wrapper.",
    type: "scale5",
  },
  /* lens 5 · what the framework missed */
  {
    id: "c-l5-missed",
    layer: "lens5",
    registers: ["collective"],
    prompt: "where did this framework miss, or get wrong, what you actually felt?",
    type: "text",
  },
  /* the verdict */
  {
    id: "c-verdict",
    layer: "verdict",
    registers: ["collective"],
    prompt: "the call for this playdate.",
    type: "choice",
    options: ["keep", "strengthen", "redesign", "remove"],
  },
  {
    id: "c-final",
    layer: "verdict",
    registers: ["collective"],
    prompt: "anything else for the team?",
    type: "text",
  },
  /* redesign (optional) */
  {
    id: "c-redesign",
    layer: "redesign",
    registers: ["collective"],
    prompt: "one thing you'd change, working from what you felt.",
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
  kid: {
    label: "i played it!",
    sub: "for the kid — a few quick taps about what it was like",
    emoji: "🧒",
  },
  grownup: {
    label: "i watched a kid play",
    sub: "for a grown-up — tick what you saw them do",
    emoji: "👀",
  },
  collective: {
    label: "i'm reviewing it",
    sub: "the collective — the five lenses, kept light",
    emoji: "🧭",
  },
};
