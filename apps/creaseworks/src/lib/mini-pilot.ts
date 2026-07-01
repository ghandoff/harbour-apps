/**
 * creaseworks mini — pilot configuration.
 *
 * Single source of truth for the friends-and-family pilot: the five
 * curated activities (from jamie's keep/strengthen table, #whirlpool
 * 2026-06-10), the look/make/show/wow stage guides, and the per-stage
 * character cast. Everything the /mini route group renders hangs off
 * this file so retuning the pilot is a one-file edit.
 *
 * Scope doc: docs/creaseworks-mini-pilot-scope.md
 */

import type { CharacterName } from "@windedvertigo/characters";

export interface MiniActivity {
  slug: string;
  /** kid-facing title + headline, snapshotted from playdates_cache */
  title: string;
  headline: string;
  /** squircle accent for this activity's tile */
  accent: string;
  /** irregular corner radii — matches the kid tile vocabulary */
  corners: string;
  /** jamie's hardening note, kept for facilitator reference */
  hardeningNote: string;
  /**
   * suggested materials — titles matching materials_cache /
   * MINI_MATERIALS exactly. the db's playdate_materials join table is
   * empty (known gap, whirlpool 2026-06-10: "we can certainly fill that
   * in"), so these lists are FIRST-PASS AUTHORED for the pilot and feed
   * the match-rate. ⚠ review with jamie/garrett before family sessions.
   */
  materials: string[];
  /** weather-dependent (needs sky/sun) — shows a "best outside ☀️" tag */
  outdoor?: boolean;
}

/**
 * The five pilot activities, in jamie's table order.
 * All five are `ready` in playdates_cache — the mini queries them by slug.
 */
export const MINI_ACTIVITIES: MiniActivity[] = [
  {
    slug: "character-from-a-crease",
    title: "character from a crease",
    headline: "fold paper and let the creases tell you who lives inside",
    accent: "var(--wv-cornflower)",
    corners: "22px 28px 18px 26px",
    hardeningNote:
      "best in collection. directly enacts trace theory. add layer 3 provocation.",
    materials: [
      "craft paper",
      "cardstock",
      "big paper",
      "aluminum foil",
      "washable markers",
      "colored pencils",
      "googly eyes",
      "stickers",
    ],
  },
  {
    slug: "function-swap-same-form",
    title: "function swap, same form",
    headline: "keep the same stuff — change what it's FOR",
    accent: "var(--wv-teal)",
    corners: "26px 20px 28px 22px",
    hardeningNote: "model-shifting at its clearest. add facilitator pace.",
    materials: [
      "bottle caps",
      "paper cups",
      "clothespins",
      "binder clips",
      "cardboard tubes",
      "wine corks",
      "muffin tin",
      "paper plates",
    ],
  },
  {
    slug: "design-a-rule-not-an-object",
    title: "design a rule, not an object",
    headline: "instead of building a thing, invent a RULE that changes how things work",
    accent: "var(--wv-seafoam)",
    corners: "20px 26px 24px 28px",
    hardeningNote: "rules make reality. most conceptually ambitious. add layer 3.",
    materials: [
      "buttons",
      "dice",
      "playing cards",
      "popsicle sticks",
      "plastic beads",
      "letter tiles",
      "string / yarn",
      "tape",
    ],
  },
  {
    slug: "take-apart-archaeology",
    title: "take-apart archaeology",
    headline: "open up a broken thing and discover what's hiding inside",
    accent: "var(--wv-periwinkle)",
    corners: "28px 22px 26px 20px",
    hardeningNote: "closest to layer 3 already. deepen facilitator pace substantially.",
    materials: [
      "old gadgets",
      "toy parts",
      "egg cartons",
      "plastic bottles",
      "shoebox",
      "rubber bands",
    ],
  },
  {
    slug: "mend-a-stuffed-friend",
    title: "mend a stuffed friend",
    headline: "fix a torn stuffed animal and learn the superpower of repair",
    accent: "var(--wv-mint)",
    corners: "24px 20px 28px 22px",
    hardeningNote:
      "kintsugi already gestures at layer 3. strengthen provocation. UDL: fine motor.",
    materials: [
      "cloth scraps",
      "felt sheets",
      "string / yarn",
      "buttons",
      "ribbon",
      "white sock",
      "cotton balls",
      "washi tape",
      "googly eyes",
    ],
  },

  /* ── the 6 sampler playdates, imported for the crease.camp session
     (pull-and-map from playdates_cache; content in MINI_ACTIVITY_CONTENT) ── */
  {
    slug: "function-tag-scavenger",
    title: "function tag scavenger",
    headline: "find three things nearby and turn them into something you can play with",
    accent: "var(--wv-sienna)",
    corners: "26px 22px 28px 20px",
    hardeningNote: "sampler import for crease.camp — any-materials; give each found object a job.",
    materials: ["old gadgets", "toy parts", "paper cups", "bottle caps"],
  },
  {
    slug: "kek-loop-micro-experience",
    title: "kek loop micro-experience",
    headline: "guess what will happen, make something fast, then see if your guess was right",
    accent: "var(--wv-redwood)",
    corners: "20px 28px 22px 26px",
    hardeningNote: "sampler import for crease.camp — predict / make fast / compare loop.",
    materials: ["big paper", "craft paper", "cardstock", "popsicle sticks"],
  },
  {
    slug: "transfer-test-find-again",
    title: "transfer test (find again)",
    headline: "build the same idea with two totally different materials and see what changes in YOU",
    accent: "var(--wv-forest)",
    corners: "28px 24px 20px 26px",
    hardeningNote: "sampler import for crease.camp — same idea, two very different materials.",
    materials: ["cardstock", "craft paper", "buttons", "popsicle sticks", "tape"],
  },
  {
    slug: "leaf-press-telegraph",
    title: "leaf press telegraph",
    headline: "send a message using only leaves",
    accent: "var(--wv-moss)",
    corners: "22px 26px 28px 20px",
    hardeningNote: "sampler import for crease.camp — nature materials; bring leaves in if indoors.",
    materials: ["leaves", "sticks", "stones", "big paper"],
  },
  {
    slug: "cloud-cartographer",
    title: "cloud cartographer",
    headline: "map the sky before it changes",
    accent: "var(--wv-cornflower)",
    corners: "26px 20px 24px 28px",
    hardeningNote: "sampler import for crease.camp — observation; needs a view of the sky.",
    materials: ["washable markers", "colored pencils", "big paper", "craft paper"],
    outdoor: true,
  },
  {
    slug: "shadow-tracker",
    title: "shadow tracker",
    headline: "follow the sun with a pencil",
    accent: "var(--wv-teal)",
    corners: "24px 28px 20px 26px",
    hardeningNote: "sampler import for crease.camp — observation; needs sun.",
    materials: ["colored pencils", "washable markers", "sticks"],
    outdoor: true,
  },
];

/**
 * Fallback activity when a child's found materials match nothing well —
 * "whatever you collect is right" (jamie, whirlpool 2026-06-10).
 */
export const MINI_FALLBACK_SLUG = "character-from-a-crease";

export const MINI_ACTIVITY_SLUGS = MINI_ACTIVITIES.map((a) => a.slug);

export type MiniStageKey = "look" | "make" | "show" | "wow";

export interface MiniStage {
  key: MiniStageKey;
  /** kid-facing label */
  label: string;
  /** character guide for this stage (kid variant via ambient provider) */
  character: CharacterName;
  /** one-line kid-language blurb, read aloud by the facilitator */
  kidBlurb: string;
  /** one-line adult framing — print guide only, NOT shown on kid surfaces */
  adultBlurb: string;
  /** light tint for the stage hero band (cadet text stays ≥ AA on all) */
  tint: string;
  /** mid-tone accent for chips/borders/active states */
  accent: string;
  /** the grown-up corner content for this stage — short lines, read in the sheet */
  adultGuide: string[];
}

/**
 * The four stages of the creaseworks cycle in child-friendly language
 * (renamed from find/fold/unfold/find-again — whirlpool 2026-06-10).
 * Character assignments: mud anchors make (the fold phase, per the
 * pre-launch polish plan); the others are first-pass picks — retune here.
 */
export const MINI_STAGES: MiniStage[] = [
  {
    key: "look",
    label: "look!",
    character: "twig",
    kidBlurb: "let's go hunting! what can you find?",
    adultBlurb:
      "the find phase — children gather everyday materials. minimal instruction; let them lead.",
    tint: "var(--wv-periwinkle)",
    accent: "var(--wv-cornflower)",
    adultGuide: [
      "this is the find phase: your child hunts for everyday materials around the house or classroom.",
      "give minimal instruction — \u201cwhat can you find?\u201d is enough. let them lead.",
      "anything they bring back is right. odd choices make the best activities.",
    ],
  },
  {
    key: "make",
    label: "make!",
    character: "mud",
    kidBlurb: "time to make something!",
    adultBlurb:
      "the fold phase — a playdate matched to their materials. form and function become fluid.",
    tint: "var(--wv-mint)",
    accent: "var(--wv-teal)",
    adultGuide: [
      "the app matched an activity to what they found — the instructions are right on this page.",
      "read the \u201cread aloud\u201d block to them, then step back.",
      "resist fixing or finishing their build. when they use something \u201cwrong\u201d, that's the point.",
    ],
  },
  {
    key: "show",
    label: "show!",
    character: "swatch",
    kidBlurb: "show us what you made!",
    adultBlurb:
      "the unfold phase — snap a photo, capture their words. you type or record; they talk.",
    tint: "var(--wv-seafoam)",
    accent: "var(--wv-navy)",
    adultGuide: [
      "snap a photo of the creation and type what your child says about it.",
      "their exact words beat tidy summaries — \u201cit has three eyes and its name is wobbles\u201d is perfect.",
      "you need your family code saved (below) to share.",
    ],
  },
  {
    key: "wow",
    label: "wow!",
    character: "drip",
    kidBlurb: "look what other kids made!",
    adultBlurb:
      "the find-again phase — the curated wall. submissions are reviewed before they appear.",
    tint: "color-mix(in srgb, var(--wv-cornflower) 18%, var(--wv-white))",
    accent: "var(--wv-cornflower)",
    adultGuide: [
      "everything here was shared by other pilot families and reviewed by us first.",
      "nothing your family shares is public until we approve it.",
      "ask: \u201cwhat would you try next?\u201d — then go look again!",
    ],
  },
];

export function getMiniStage(key: MiniStageKey): MiniStage {
  // keys are a closed union — find never misses
  return MINI_STAGES.find((s) => s.key === key)!;
}

/**
 * The mini flavour (CW_MINI build) serves the pilot pages at the
 * basePath root via rewrites — clean URLs like
 * windedvertigo.com/harbour/creaseworks-mini/look. The prod flavour
 * keeps them under /mini. All mini-internal links go through this
 * helper so both flavours navigate correctly.
 */
export const MINI_AT_ROOT = process.env.NEXT_PUBLIC_CW_MINI === "1";

export function miniHref(path: "" | `/${string}`): string {
  return MINI_AT_ROOT ? path || "/" : `/mini${path}`;
}

/** Current stage segment from a usePathname() value, flavour-agnostic. */
export function miniStageFromPathname(pathname: string): string | null {
  const seg = pathname.replace(/^\/mini/, "").split("/")[1];
  return seg || null;
}

/* ── found-materials session state ─────────────────────────────────
 * What the child collected during look, carried to make for matching.
 * sessionStorage (not server state): the pilot has no accounts, and a
 * hunt belongs to one sitting on one device. */

const FOUND_KEY = "cw-mini-found";

export function saveFound(titles: string[]): void {
  try {
    sessionStorage.setItem(FOUND_KEY, JSON.stringify(titles));
  } catch {
    /* private mode etc. — make falls back to the fallback activity */
  }
}

export function loadFound(): string[] {
  try {
    const raw = sessionStorage.getItem(FOUND_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/* ── selected playdate (carried make → show) ────────────────────────
 * The activity the child actually played. Without this the show stage
 * re-guessed the playdate from the matcher (or fell back to a hard-coded
 * default), so the reflection prompt + recorded eval/evidence + dashboard
 * could attribute to the WRONG game — the make choice lived only in React
 * state and was lost on navigation. sessionStorage, same as found. */

const SELECTED_KEY = "cw-mini-activity";

export function saveSelected(slug: string): void {
  try {
    sessionStorage.setItem(SELECTED_KEY, slug);
  } catch {
    /* private mode — show falls back to the matcher */
  }
}

export function loadSelected(): string | null {
  try {
    return sessionStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

/* ── family code (pilot session) ────────────────────────────────────
 * Entered once by the grown-up on the welcome page; everything the
 * family shares attaches to it. localStorage so it survives the visit. */

const CODE_KEY = "cw-mini-code";

export function saveCode(code: string): void {
  try {
    localStorage.setItem(CODE_KEY, code);
    // cookie too, so server routes (the 🐛 feedback endpoint) can attach
    // the code without the client threading it through every payload
    document.cookie = `cw-mini-code=${code}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* private mode — show falls back to asking again */
  }
}

export function loadCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

/* ── match-rate ─────────────────────────────────────────────────────
 * Score each activity by how much of its suggested-materials list the
 * child found ("82% match rate" concept from the whirlpool). */

export interface MiniMatch {
  activity: MiniActivity;
  /** found titles that appear in the activity's list */
  matched: string[];
  /** matched / suggested, 0..1 */
  score: number;
  /** true when nothing matched well and the fallback rule fired */
  isFallback: boolean;
}

/** An activity needs at least this many matched materials to win outright. */
const MIN_MATCHES = 2;

/**
 * Rank the five activities against what the child found. Always returns
 * a winner: when no activity clears MIN_MATCHES, character-from-a-crease
 * takes the top slot — "whatever you collect is right."
 */
export function matchActivities(found: string[]): MiniMatch[] {
  const foundSet = new Set(found);

  const ranked = MINI_ACTIVITIES.map((activity) => {
    const matched = activity.materials.filter((m) => foundSet.has(m));
    return {
      activity,
      matched,
      score: matched.length / activity.materials.length,
      isFallback: false,
    };
  }).sort((a, b) => b.score - a.score || b.matched.length - a.matched.length);

  if (ranked[0].matched.length >= MIN_MATCHES) return ranked;

  // nothing matched well — promote the fallback to the front
  const fallback = ranked.find((r) => r.activity.slug === MINI_FALLBACK_SLUG)!;
  fallback.isFallback = true;
  return [fallback, ...ranked.filter((r) => r !== fallback)];
}
