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

export default async function HuntPage() {
  const contexts = await getDistinctContexts();

  return (
    <main className="px-4 pt-8 pb-24 sm:px-6 sm:pt-14 sm:pb-16">
      {/* ── header zone — same width + height on all find modes ── */}
      <div className="max-w-2xl mx-auto">
        <Link
          href="/matcher"
          className="text-sm hover:opacity-80 transition-opacity mb-5 sm:mb-7 inline-flex items-center gap-1.5"
          style={{ color: "var(--wv-champagne)", opacity: 0.45 }}
        >
          <span>&larr;</span> back to find
        </Link>

        {/* ── hero copy — fixed min-height ───────────────────── */}
        <div className="relative mb-6 sm:mb-8" style={{ minHeight: 152 }}>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "var(--wv-champagne)" }}
          >
            what sounds fun?{" "}
            <span className="inline-block" style={{ animation: "heroWave 2s ease-in-out infinite" }}>🗺️</span>
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-xl"
            style={{ color: "var(--wv-champagne)", opacity: 0.55 }}
          >
            pick a vibe and we&apos;ll find you an adventure
          </p>
        </div>

        <FindModeSelector currentMode="hunt" />
      </div>

      {/* ── content zone ─────────────────────────────────────── */}
      <div className="max-w-lg mx-auto">
        <HuntShell contexts={contexts} />
      </div>

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
