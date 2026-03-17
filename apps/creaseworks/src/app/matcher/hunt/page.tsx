/**
 * /matcher/hunt — scavenger hunt mode.
 *
 * The "find" phase made physical. Instead of picking materials and
 * finding playdates, the system picks a playdate and sends the kid
 * on a hunt for what they need.
 *
 * The hunt itself is the learning. Every time a kid picks up a
 * toilet paper roll and sees a telescope, that's the seed being
 * planted for "find again" — when they come back with new eyes.
 *
 * Supports solo and two-player (pass-the-phone) modes.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getDistinctContexts } from "@/lib/queries/matcher";
import HuntShell from "@/components/hunt/hunt-shell";
import FindModeSelector from "@/components/matcher/find-mode-selector";

export const metadata: Metadata = {
  title: "scavenger hunt",
  description:
    "pick a vibe, get a mission, go find what you need. the hunt is the adventure!",
};

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function HuntPage() {
  const contexts = await getDistinctContexts();

  return (
    <main
      className="min-h-screen px-4 pt-8 pb-24 sm:px-6 sm:pt-14 sm:pb-16"
      style={{
        backgroundColor: "var(--wv-cadet)",
        background:
          "linear-gradient(175deg, rgba(39,50,72,1) 0%, rgba(39,50,72,0.97) 40%, rgba(39,50,72,0.95) 100%)",
      }}
    >
      <div className="max-w-lg mx-auto">
        <Link
          href="/matcher"
          className="text-sm hover:opacity-80 transition-opacity mb-5 sm:mb-7 inline-flex items-center gap-1.5"
          style={{ color: "var(--wv-champagne)", opacity: 0.45 }}
        >
          <span>&larr;</span> back to find
        </Link>

        <FindModeSelector currentMode="hunt" />

        <HuntShell contexts={contexts} />
      </div>
    </main>
  );
}
