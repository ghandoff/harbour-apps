/**
 * Superuser "preview-as" fixtures for /harbour/account.
 *
 * Lets a winded.vertigo staff member (the harbourmaster) preview what each
 * member persona's account looks like — WITHOUT touching another person's real
 * data. Every value here is fabricated sample data; the preview path makes NO
 * database reads and NO writes. Gating to staff happens in the page (via
 * `isStaffEmail`); this module is pure data.
 *
 * Personas map to Garrett's four profiles:
 *   visitor       — signed-in, no profile yet (the aboard→crew nudge state)
 *   profiled      — completed profile, just earned welcome knots
 *   crew          — engaged "purchaser": owns packs, climbing the rank ladder
 *   harbourmaster — the real staff view (full-access badge)
 *
 * Types are reused verbatim from the live code so the existing /account render
 * needs no changes — only the data feeding it swaps.
 */

import { rankFor, type RankState } from "./knots";
import type { Pack, CreditEntry } from "./queries/membership";

export type PreviewPersona = "visitor" | "profiled" | "crew" | "harbourmaster";

const PERSONAS: readonly PreviewPersona[] = [
  "visitor",
  "profiled",
  "crew",
  "harbourmaster",
];

/** Validate a `?preview=` query value against the known personas. */
export function parsePersona(v: string | undefined): PreviewPersona | null {
  return v && (PERSONAS as readonly string[]).includes(v)
    ? (v as PreviewPersona)
    : null;
}

/** The exact shape /account renders — fixtures fill this instead of the DB. */
export interface AccountView {
  staff: boolean;
  onboardingCompleted: boolean;
  profileRoles: string[];
  profileIntent: string[];
  knotsBalance: number;
  rank: RankState;
  creditBalance: number;
  owned: Pack[];
  available: Pack[];
  ledger: CreditEntry[];
}

/** Clearly-fabricated sample pack (ids prefixed `fixture-`). */
function pack(
  id: string,
  title: string,
  app: string,
  priceCents: number | null,
): Pack {
  return {
    packCatalogueId: `fixture-cat-${id}`,
    packCacheId: `fixture-${id}`,
    title,
    slug: id,
    app,
    productType: "pack",
    priceCents,
    currency: "USD",
  };
}

const SAMPLE_AVAILABLE: Pack[] = [
  pack("reflection-starter", "reflection starter pack", "creaseworks", 1900),
  pack("assessment-rethink", "assessment rethink toolkit", "depth-chart", 2900),
  pack("family-play", "family play deck", "creaseworks", 1200),
];

const SAMPLE_OWNED: Pack[] = [
  pack("reflection-starter", "reflection starter pack", "creaseworks", 1900),
];

const SAMPLE_LEDGER: CreditEntry[] = [
  { createdAt: "2026-05-20T10:00:00Z", delta: 3, label: "reflection_completed", kind: "earn" },
  { createdAt: "2026-05-22T14:30:00Z", delta: 2, label: "reflection_completed", kind: "earn" },
];

/** Build the sample account view for a persona. Pure — no IO. */
export function previewFixture(persona: PreviewPersona): AccountView {
  switch (persona) {
    case "harbourmaster":
      return {
        staff: true,
        onboardingCompleted: true,
        profileRoles: [],
        profileIntent: [],
        knotsBalance: 0,
        rank: rankFor(0),
        creditBalance: 0,
        owned: [],
        available: [],
        ledger: [],
      };
    case "visitor":
      return {
        staff: false,
        onboardingCompleted: false,
        profileRoles: [],
        profileIntent: [],
        knotsBalance: 0,
        rank: rankFor(0),
        creditBalance: 0,
        owned: [],
        available: SAMPLE_AVAILABLE,
        ledger: [],
      };
    case "profiled":
      return {
        staff: false,
        onboardingCompleted: true,
        profileRoles: ["educator"],
        profileIntent: ["rethink-assessment"],
        knotsBalance: 20,
        rank: rankFor(20),
        creditBalance: 0,
        owned: [],
        available: SAMPLE_AVAILABLE,
        ledger: [],
      };
    case "crew":
      return {
        staff: false,
        onboardingCompleted: true,
        profileRoles: ["facilitator", "educator"],
        profileIntent: ["run-session"],
        knotsBalance: 160,
        rank: rankFor(160),
        creditBalance: 5,
        owned: SAMPLE_OWNED,
        available: SAMPLE_AVAILABLE.filter(
          (p) => !SAMPLE_OWNED.some((o) => o.packCacheId === p.packCacheId),
        ),
        ledger: SAMPLE_LEDGER,
      };
  }
}
