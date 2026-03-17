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
        background:
          "linear-gradient(175deg, rgba(255,235,210,0.25) 0%, rgba(228,196,137,0.06) 30%, rgba(255,255,255,0) 55%)",
      }}
    >
      <div className="max-w-lg mx-auto">
        <Link
          href="/matcher"
          className="text-sm hover:opacity-80 transition-opacity mb-5 sm:mb-7 inline-flex items-center gap-1.5"
          style={{ color: "var(--wv-cadet)", opacity: 0.45 }}
        >
          <span>&larr;</span> back to find
        </Link>

        <HuntShell contexts={contexts} />
      </div>
    </main>
  );
}
