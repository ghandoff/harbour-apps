/**
 * /matcher — the "find" phase of find, fold, unfold, find again.
 *
 * The flat paper at rest, waiting to be noticed. This page celebrates
 * the joy of looking, noticing, and discovering what's around you.
 * Every cardboard box is a castle. Every stick is a magic wand.
 *
 * Four ways to find:
 *   - explore rooms  → spatial, kid-first, emoji tiles by place
 *   - classic picker → the original tile-based material selector
 *   - challenge      → timed noticing game (separate route)
 *   - scavenger hunt → reversed matcher, go find stuff (separate route)
 *
 * Server component that fetches picker data and passes to the
 * client-side form component.
 *
 * Background is cadet blue for contrast — UDL accessibility concern
 * with white-on-champagne readability.
 */

import type { Metadata } from "next";
import Link from "next/link";

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
import MatcherInputForm from "@/components/matcher/matcher-input-form";
import RoomExplorer from "@/components/matcher/room-explorer";
import FindModeSelector from "@/components/matcher/find-mode-selector";

export const dynamic = "force-dynamic";

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

  const mode = params.mode === "classic" ? "classic" : "rooms";

  return (
    <main className="px-4 pt-8 pb-24 sm:px-6 sm:pt-14 sm:pb-16">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="text-sm hover:opacity-80 transition-opacity mb-5 sm:mb-7 inline-flex items-center gap-1.5"
          style={{ color: "var(--wv-champagne)", opacity: 0.45 }}
        >
          <span>&larr;</span> creaseworks
        </Link>

        {/* ── playful hero heading ──────────────────────────── */}
        <div className="relative mb-6 sm:mb-8">
          {/* decorative floating shapes — desktop only */}
          <div
            className="hidden sm:block absolute -left-10 top-2 w-5 h-5 rounded-lg"
            style={{
              backgroundColor: "var(--wv-champagne)",
              opacity: 0.15,
              transform: "rotate(12deg)",
            }}
          />
          <div
            className="hidden sm:block absolute -left-6 top-12 w-3 h-3 rounded-full"
            style={{
              backgroundColor: "var(--wv-sienna)",
              opacity: 0.2,
            }}
          />
          <div
            className="hidden sm:block absolute -right-6 top-4 w-4 h-4 rounded-full"
            style={{
              backgroundColor: "var(--wv-redwood)",
              opacity: 0.15,
            }}
          />

          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "var(--wv-champagne)" }}
          >
            what do you notice?{" "}
            <span
              className="inline-block"
              style={{
                animation: "heroWave 2s ease-in-out infinite",
              }}
            >
              👀
            </span>
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-xl"
            style={{ color: "var(--wv-champagne)", opacity: 0.55 }}
          >
            look around — what stuff do you have? cardboard boxes, sticks, old
            t-shirts, tape? pick what you find and we&apos;ll show you what
            these can become.
          </p>
        </div>

        {/* ── find mode links ──────────────────────────────── */}
        <FindModeSelector currentMode={mode} />

        {/* ── main content ─────────────────────────────────── */}
        {mode === "rooms" ? (
          <RoomExplorer
            materials={materials}
            slots={slots}
            contexts={contexts}
          />
        ) : (
          <MatcherInputForm
            materials={materials}
            forms={forms}
            slots={slots}
            contexts={contexts}
          />
        )}
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
