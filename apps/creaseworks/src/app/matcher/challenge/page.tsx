/**
 * /matcher/challenge — timer challenge mode.
 *
 * "how much can you notice?" — a timed noticing game.
 * The timer adds playful urgency. The celebration is always about
 * what you spotted, never about how fast you were.
 *
 * Part of the "find" phase: celebrating the joy of looking.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getAllMaterials } from "@/lib/queries/materials";
import { getDistinctSlots } from "@/lib/queries/matcher";
import ChallengeShell from "@/components/challenge/challenge-shell";
import FindModeSelector from "@/components/matcher/find-mode-selector";

export const metadata: Metadata = {
  title: "challenge",
  description:
    "how much can you notice? a timed game to see what's around you.",
};

export const dynamic = "force-dynamic";

export default async function ChallengePage() {
  const [materials, slots] = await Promise.all([
    getAllMaterials(),
    getDistinctSlots(),
  ]);

  return (
    <main className="px-4 pt-8 pb-24 sm:px-6 sm:pt-14 sm:pb-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/matcher"
          className="text-sm hover:opacity-80 transition-opacity mb-5 sm:mb-7 inline-flex items-center gap-1.5"
          style={{ color: "var(--wv-champagne)", opacity: 0.45 }}
        >
          <span>&larr;</span> back to find
        </Link>

        <FindModeSelector currentMode="challenge" />

        <ChallengeShell materials={materials} slots={slots} />
      </div>
    </main>
  );
}
