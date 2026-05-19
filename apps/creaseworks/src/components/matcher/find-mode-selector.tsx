"use client";

/**
 * FindModeSelector — lets kids (or parents) choose how to find.
 *
 * Four ways to explore the "find" phase:
 *   📋 classic picker  — the original tile-based material selector
 *   🏠 explore rooms   — spatial, place-based discovery
 *   ⏱️ challenge       — timed noticing game
 *   🗺️ scavenger hunt  — reversed matcher, go find stuff
 *
 * 2×2 grid of tappable cards (not pills). Displayed across all
 * find-phase routes so navigation is always available.
 */

import Link from "next/link";

export type FindMode = "rooms" | "classic" | "challenge" | "hunt";

interface FindModeSelectorProps {
  currentMode: FindMode;
}

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const MODES: { key: FindMode; href: string; emoji: string; label: string; description: string; accent: string; corners: string }[] = [
  { key: "classic", href: "/find?mode=classic", emoji: "📋", label: "classic picker", description: "tap what you have",      accent: "var(--wv-cornflower)", corners: "22px 28px 18px 26px" },
  { key: "rooms",   href: "/find",              emoji: "🏠", label: "explore rooms",  description: "look around a place",     accent: "var(--wv-teal)",        corners: "26px 20px 28px 22px" },
  { key: "challenge", href: "/find?mode=challenge", emoji: "⏱️", label: "challenge",  description: "how much can you notice?", accent: "var(--wv-seafoam)",     corners: "20px 26px 24px 28px" },
  { key: "hunt",    href: "/find?mode=hunt",    emoji: "🗺️", label: "scavenger hunt", description: "go find your stuff!",     accent: "var(--wv-periwinkle)",  corners: "28px 22px 26px 20px" },
];

export default function FindModeSelector({
  currentMode,
}: FindModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
      {MODES.map((mode) => {
        const active = currentMode === mode.key;
        return (
          <Link
            key={mode.key}
            href={mode.href}
            className="px-3 py-3 text-center active:scale-[0.96] flex flex-col items-center gap-1"
            style={{
              // kid tile vocabulary: cream bg, squircle corners, per-mode accent.
              // Active: filled accent bg + white text (same pattern as mph-tile--on).
              backgroundColor: active ? mode.accent : "var(--wv-cream)",
              color: active ? "var(--wv-white)" : "var(--wv-cadet)",
              borderRadius: mode.corners,
              border: active
                ? `2px solid ${mode.accent}`
                : "1.5px solid rgba(39, 50, 72, 0.08)",
              boxShadow: active
                ? `0 4px 0 rgba(39, 50, 72, 0.1), 0 0 0 3px color-mix(in srgb, ${mode.accent} 20%, transparent)`
                : "0 2px 0 rgba(39, 50, 72, 0.08)",
              fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif",
              transition: `all 200ms ${SPRING}`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span className="text-lg leading-none">{mode.emoji}</span>
            <span className="text-xs font-bold tracking-wider leading-tight">
              {mode.label}
            </span>
            <span
              className="text-xs leading-tight hidden sm:block"
              style={{ opacity: active ? 0.7 : 0.4, fontSize: "0.6rem" }}
            >
              {mode.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
