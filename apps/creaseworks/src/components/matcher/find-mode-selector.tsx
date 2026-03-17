"use client";

/**
 * FindModeSelector — lets kids (or parents) choose how to find.
 *
 * Four ways to explore the "find" phase:
 *   🏠 explore rooms   — spatial, place-based discovery
 *   📋 classic picker  — the original search + pill-based selector
 *   ⏱️ challenge       — timed noticing game
 *   🗺️ scavenger hunt  — reversed matcher, go find stuff
 *
 * The first two toggle the mode on the same page via searchParams.
 * The last two link to separate routes.
 */

import Link from "next/link";

interface FindModeSelectorProps {
  currentMode: "rooms" | "classic";
}

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export default function FindModeSelector({
  currentMode,
}: FindModeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {/* room explorer */}
      <Link
        href="/matcher"
        className="rounded-xl px-3.5 py-2 text-xs font-bold tracking-wider active:scale-95"
        style={{
          backgroundColor:
            currentMode === "rooms"
              ? "var(--wv-sienna)"
              : "rgba(39, 50, 72, 0.04)",
          color:
            currentMode === "rooms" ? "var(--wv-white)" : "var(--wv-cadet)",
          opacity: currentMode === "rooms" ? 1 : 0.6,
          transition: `all 200ms ${SPRING}`,
          border:
            currentMode === "rooms"
              ? "none"
              : "1.5px solid rgba(39, 50, 72, 0.08)",
        }}
      >
        🏠 explore rooms
      </Link>

      {/* classic */}
      <Link
        href="/matcher?mode=classic"
        className="rounded-xl px-3.5 py-2 text-xs font-bold tracking-wider active:scale-95"
        style={{
          backgroundColor:
            currentMode === "classic"
              ? "var(--wv-sienna)"
              : "rgba(39, 50, 72, 0.04)",
          color:
            currentMode === "classic" ? "var(--wv-white)" : "var(--wv-cadet)",
          opacity: currentMode === "classic" ? 1 : 0.6,
          transition: `all 200ms ${SPRING}`,
          border:
            currentMode === "classic"
              ? "none"
              : "1.5px solid rgba(39, 50, 72, 0.08)",
        }}
      >
        📋 classic picker
      </Link>

      {/* divider */}
      <span
        className="hidden sm:block"
        style={{
          width: 1,
          height: 20,
          backgroundColor: "rgba(39, 50, 72, 0.1)",
          margin: "0 4px",
        }}
      />

      {/* challenge */}
      <Link
        href="/matcher/challenge"
        className="rounded-xl px-3.5 py-2 text-xs font-bold tracking-wider active:scale-95"
        style={{
          backgroundColor: "rgba(39, 50, 72, 0.04)",
          color: "var(--wv-cadet)",
          opacity: 0.6,
          transition: `all 200ms ${SPRING}`,
          border: "1.5px solid rgba(39, 50, 72, 0.08)",
        }}
      >
        ⏱️ challenge
      </Link>

      {/* scavenger hunt */}
      <Link
        href="/matcher/hunt"
        className="rounded-xl px-3.5 py-2 text-xs font-bold tracking-wider active:scale-95"
        style={{
          backgroundColor: "rgba(39, 50, 72, 0.04)",
          color: "var(--wv-cadet)",
          opacity: 0.6,
          transition: `all 200ms ${SPRING}`,
          border: "1.5px solid rgba(39, 50, 72, 0.08)",
        }}
      >
        🗺️ scavenger hunt
      </Link>
    </div>
  );
}
