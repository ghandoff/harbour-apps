/**
 * Shop boat registry — maps an app slug to the art the storefront needs:
 * its bespoke boat SVG (when one exists), its accent, label, tagline, and the
 * app-icon tile that flies on the boat's flag.
 *
 * Boat identity (label/accent/tagline) is pulled from the canonical
 * HARBOUR_APPS registry so it never drifts from the rest of the harbour. The
 * bespoke boat artwork is copied into apps/harbour/public/harbour-preview/
 * (the harbour Worker is its own deploy and can't reach the site repo's
 * public dir). Apps without bespoke art get a procedural fallback boat — see
 * BoatArt — so they still read as vessels until Payton delivers their SVG.
 *
 * basePath note: raw <img src> does NOT get /harbour auto-prepended (only
 * Link/router/redirect do), so the paths below carry the /harbour prefix.
 */

import { HARBOUR_APPS } from "@windedvertigo/auth/harbour-apps-data";

const BP = "/harbour";

/** Apps with bespoke boat artwork present in public/harbour-preview/. */
const BOAT_SVG: Record<string, string> = {
  "vertigo-vault": `${BP}/harbour-preview/vertigo-vault.svg`,
  creaseworks: `${BP}/harbour-preview/crease-works.svg`,
};

export interface ShopBoat {
  slug: string;
  label: string;
  accent: string;
  tagline: string;
  /** bespoke boat SVG url, or null → procedural fallback */
  boatSvg: string | null;
  /** app tile png, flown on the boat's flag */
  icon: string;
}

const META = new Map<string, (typeof HARBOUR_APPS)[number]>(
  HARBOUR_APPS.map((a) => [a.key, a]),
);

/** Build the boat identity for an app slug (tolerant of unknown slugs). */
export function boatFor(slug: string): ShopBoat {
  const a = META.get(slug);
  return {
    slug,
    label: a?.label ?? slug,
    accent: a?.accent ?? "#e0a878",
    tagline: a?.tagline ?? "",
    boatSvg: BOAT_SVG[slug] ?? null,
    icon: `${BP}/images/${slug}.png`,
  };
}
