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
  /** squircle accent for this activity's tile */
  accent: string;
  /** irregular corner radii — matches the kid tile vocabulary */
  corners: string;
  /** jamie's hardening note, kept for facilitator reference */
  hardeningNote: string;
}

/**
 * The five pilot activities, in jamie's table order.
 * All five are `ready` in playdates_cache — the mini queries them by slug.
 */
export const MINI_ACTIVITIES: MiniActivity[] = [
  {
    slug: "character-from-a-crease",
    accent: "var(--wv-cornflower)",
    corners: "22px 28px 18px 26px",
    hardeningNote:
      "best in collection. directly enacts trace theory. add layer 3 provocation.",
  },
  {
    slug: "function-swap-same-form",
    accent: "var(--wv-teal)",
    corners: "26px 20px 28px 22px",
    hardeningNote: "model-shifting at its clearest. add facilitator pace.",
  },
  {
    slug: "design-a-rule-not-an-object",
    accent: "var(--wv-seafoam)",
    corners: "20px 26px 24px 28px",
    hardeningNote: "rules make reality. most conceptually ambitious. add layer 3.",
  },
  {
    slug: "take-apart-archaeology",
    accent: "var(--wv-periwinkle)",
    corners: "28px 22px 26px 20px",
    hardeningNote: "closest to layer 3 already. deepen facilitator pace substantially.",
  },
  {
    slug: "mend-a-stuffed-friend",
    accent: "var(--wv-mint)",
    corners: "24px 20px 28px 22px",
    hardeningNote:
      "kintsugi already gestures at layer 3. strengthen provocation. UDL: fine motor.",
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
  /** one-line adult framing shown in the facilitator strip */
  adultBlurb: string;
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
    kidBlurb: "let's go hunting! what can you find around you?",
    adultBlurb:
      "the find phase — children gather everyday materials. minimal instruction; let them lead.",
  },
  {
    key: "make",
    label: "make!",
    character: "mud",
    kidBlurb: "time to make something with what you found!",
    adultBlurb:
      "the fold phase — a playdate matched to their materials. form and function become fluid.",
  },
  {
    key: "show",
    label: "show!",
    character: "swatch",
    kidBlurb: "show us what you made! tell us about it!",
    adultBlurb:
      "the unfold phase — snap a photo, capture their words. you type or record; they talk.",
  },
  {
    key: "wow",
    label: "wow!",
    character: "drip",
    kidBlurb: "look what other kids made! what will you try next?",
    adultBlurb:
      "the find-again phase — the curated wall. submissions are reviewed before they appear.",
  },
];

export function getMiniStage(key: MiniStageKey): MiniStage {
  // keys are a closed union — find never misses
  return MINI_STAGES.find((s) => s.key === key)!;
}
