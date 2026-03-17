"use client";

/**
 * FindPhaseShell — client-side orchestrator for all four find modes.
 *
 * Receives all data from the server component (materials, forms, slots,
 * contexts) and switches between modes entirely on the client. No server
 * round-trip on mode change → instant transitions, no flash.
 *
 * URL updates via history.replaceState so bookmarks/shares still work.
 * The server page reads `?mode=` on initial load to pick the right
 * starting mode.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Material } from "./types";
import type { FindMode } from "./find-mode-selector";

/* ── lazy imports for code-split — each mode only loads when used ── */
import RoomExplorer from "@/components/matcher/room-explorer";
import MatcherInputForm from "@/components/matcher/matcher-input-form";
import ChallengeShell from "@/components/challenge/challenge-shell";
import HuntShell from "@/components/hunt/hunt-shell";

/* ── hero copy per mode ─────────────────────────────────────────── */
const HEROES: Record<FindMode, { heading: string; emoji: string; body: string }> = {
  classic: {
    heading: "what do you notice?",
    emoji: "👀",
    body: "look around — what stuff do you have? cardboard boxes, sticks, old t-shirts, tape? pick what you find and we'll show you what these can become.",
  },
  rooms: {
    heading: "what do you notice?",
    emoji: "👀",
    body: "look around — what stuff do you have? cardboard boxes, sticks, old t-shirts, tape? pick what you find and we'll show you what these can become.",
  },
  challenge: {
    heading: "how much can you notice?",
    emoji: "⏱️",
    body: "pick a time, then look around and tap what you spot!",
  },
  hunt: {
    heading: "what sounds fun?",
    emoji: "🗺️",
    body: "pick a vibe and we'll find you an adventure",
  },
};

/* ── content max-width varies per mode ──────────────────────────── */
const CONTENT_WIDTH: Record<FindMode, string> = {
  rooms: "max-w-5xl",
  classic: "max-w-5xl",
  challenge: "max-w-3xl",
  hunt: "max-w-lg",
};

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const MODES: { key: FindMode; emoji: string; label: string; description: string }[] = [
  { key: "classic", emoji: "📋", label: "classic picker", description: "tap what you have" },
  { key: "rooms", emoji: "🏠", label: "explore rooms", description: "look around a place" },
  { key: "challenge", emoji: "⏱️", label: "challenge", description: "how much can you notice?" },
  { key: "hunt", emoji: "🗺️", label: "scavenger hunt", description: "go find your stuff!" },
];

export interface FindPhaseShellProps {
  initialMode: FindMode;
  materials: Material[];
  forms: string[];
  slots: string[];
  contexts: string[];
}

export default function FindPhaseShell({
  initialMode,
  materials,
  forms,
  slots,
  contexts,
}: FindPhaseShellProps) {
  const [mode, setMode] = useState<FindMode>(initialMode);
  const hero = HEROES[mode];

  const switchMode = useCallback((next: FindMode) => {
    setMode(next);
    /* update URL without server round-trip — preserves basePath */
    const path = next === "rooms" ? "/matcher" : `/matcher?mode=${next}`;
    const basePath = "/harbour/creaseworks";
    window.history.replaceState(null, "", `${basePath}${path}`);
  }, []);

  return (
    <>
      {/* ── header zone — same width + height on all find modes ── */}
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm hover:opacity-80 transition-opacity mb-5 sm:mb-7 inline-flex items-center gap-1.5"
          style={{ color: "var(--wv-champagne)", opacity: 0.45 }}
        >
          <span>&larr;</span> creaseworks
        </Link>

        {/* ── hero copy — fixed min-height for stability ────────── */}
        <div className="relative mb-6 sm:mb-8" style={{ minHeight: 152 }}>
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
            style={{ backgroundColor: "var(--wv-sienna)", opacity: 0.2 }}
          />
          <div
            className="hidden sm:block absolute -right-6 top-4 w-4 h-4 rounded-full"
            style={{ backgroundColor: "var(--wv-redwood)", opacity: 0.15 }}
          />

          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "var(--wv-champagne)" }}
          >
            {hero.heading}{" "}
            <span
              className="inline-block"
              style={{ animation: "heroWave 2s ease-in-out infinite" }}
            >
              {hero.emoji}
            </span>
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-xl"
            style={{ color: "var(--wv-champagne)", opacity: 0.55 }}
          >
            {hero.body}
          </p>
        </div>

        {/* ── mode selector — buttons, not links ─────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => switchMode(m.key)}
                className="rounded-xl px-3 py-3 text-center active:scale-[0.96] flex flex-col items-center gap-1 cursor-pointer"
                style={{
                  backgroundColor: active
                    ? "var(--wv-sienna)"
                    : "rgba(255, 255, 255, 0.06)",
                  color: active ? "var(--wv-white)" : "var(--wv-champagne)",
                  opacity: active ? 1 : 0.7,
                  transition: `all 200ms ${SPRING}`,
                  border: active
                    ? "1.5px solid var(--wv-sienna)"
                    : "1.5px solid rgba(255, 255, 255, 0.1)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span className="text-lg leading-none">{m.emoji}</span>
                <span className="text-xs font-bold tracking-wider leading-tight">
                  {m.label}
                </span>
                <span
                  className="text-xs leading-tight hidden sm:block"
                  style={{ opacity: active ? 0.7 : 0.4, fontSize: "0.6rem" }}
                >
                  {m.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── content zone — width varies per mode ────────────── */}
      <div className={`${CONTENT_WIDTH[mode]} mx-auto`}>
        {mode === "rooms" && (
          <RoomExplorer
            materials={materials}
            slots={slots}
            contexts={contexts}
          />
        )}
        {mode === "classic" && (
          <MatcherInputForm
            materials={materials}
            forms={forms}
            slots={slots}
            contexts={contexts}
          />
        )}
        {mode === "challenge" && (
          <ChallengeShell materials={materials} slots={slots} />
        )}
        {mode === "hunt" && (
          <HuntShell contexts={contexts} />
        )}
      </div>
    </>
  );
}
