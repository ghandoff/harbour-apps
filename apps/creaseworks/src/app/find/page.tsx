/**
 * /matcher — the "find" phase of find, fold, unfold, find again.
 *
 * All four find modes live on this single page:
 *   - classic picker  → ?mode=classic
 *   - explore rooms   → (default, no param)
 *   - challenge       → ?mode=challenge
 *   - scavenger hunt  → ?mode=hunt
 *
 * Server component fetches all data once. Mode switching happens
 * entirely client-side (no server round-trip → instant transitions).
 *
 * Background is cadet blue for contrast — UDL accessibility concern
 * with white-on-champagne readability.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "find",
  description:
    "look around — what do you notice? pick what you find and we'll show you something amazing to make together.",
};

import { getAllMaterials } from "@/lib/queries/materials";
import {
  getDistinctForms,
  getDistinctSlots,
  getDistinctContexts,
} from "@/lib/queries/matcher";
import FindPhaseShell from "@/components/matcher/find-phase-shell";
import type { FindMode } from "@/components/matcher/find-mode-selector";

export const dynamic = "force-dynamic";

const VALID_MODES = new Set<FindMode>(["classic", "rooms", "challenge", "hunt"]);

export default async function MatcherPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;

  const [materials, forms, slots, contexts] = await Promise.all([
    getAllMaterials(),
    getDistinctForms(),
    getDistinctSlots(),
    getDistinctContexts(),
  ]);

  const raw = params.mode as FindMode | undefined;
  const initialMode: FindMode =
    raw && VALID_MODES.has(raw) ? raw : "rooms";

  return (
    <main className="px-4 pt-8 pb-24 sm:px-6 sm:pt-14 sm:pb-16">
      <FindPhaseShell
        initialMode={initialMode}
        materials={materials}
        forms={forms}
        slots={slots}
        contexts={contexts}
      />

      <style>{`
        @keyframes heroWave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg) scale(1.1); }
          75% { transform: rotate(-5deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes heroWave { from, to { transform: none; } }
        }
      `}</style>
    </main>
  );
}
