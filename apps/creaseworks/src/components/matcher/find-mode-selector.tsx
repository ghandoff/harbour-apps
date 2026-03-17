"use client";

/**
 * FindModeSelector — lets kids (or parents) choose how to find.
 *
 * Four ways to explore the "find" phase:
 *   🏠 explore rooms   — spatial, place-based discovery
 *   📋 classic picker  — the original search + tile-based selector
 *   ⏱️ challenge       — timed noticing game
 *   🗺️ scavenger hunt  — reversed matcher, go find stuff
 *
 * Displayed across all find-phase routes so navigation is always available.
 * Uses rounded-xl card buttons (not pills / rounded-full).
 */

import Link from "next/link";

export type FindMode = "rooms" | "classic" | "challenge" | "hunt";

interface FindModeSelectorProps {
  currentMode: FindMode;
}

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const MODES: { key: FindMode; href: string; emoji: string; label: string }[] = [
  { key: "rooms", href: "/matcher", emoji: "🏠", label: "explore rooms" },
  { key: "classic", href: "/matcher?mode=classic", emoji: "📋", label: "classic picker" },
  { key: "challenge", href: "/matcher/challenge", emoji: "⏱️", label: "challenge" },
  { key: "hunt", href: "/matcher/hunt", emoji: "🗺️", label: "scavenger hunt" },
];

export default function FindModeSelector({
  currentMode,
}: FindModeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {MODES.map((mode) => {
        const active = currentMode === mode.key;
        return (
          <Link
            key={mode.key}
            href={mode.href}
            className="rounded-xl px-3.5 py-2 text-xs font-bold tracking-wider active:scale-95"
            style={{
              backgroundColor: active
                ? "var(--wv-sienna)"
                : "rgba(255, 255, 255, 0.1)",
              color: active ? "var(--wv-white)" : "var(--wv-champagne)",
              opacity: active ? 1 : 0.6,
              transition: `all 200ms ${SPRING}`,
              border: active
                ? "1.5px solid var(--wv-sienna)"
                : "1.5px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {mode.emoji} {mode.label}
          </Link>
        );
      })}
    </div>
  );
}
