"use client";

/**
 * mini look — pick a way to hunt for materials.
 *
 * Four find modes from the pilot scope, rendered as big squircle tiles.
 * Classic picker and timer challenge ship first (the two proven modes);
 * show & guess and find-by-property follow in slice 4 — their tiles are
 * present but marked "soon" so the layout is honest about what's coming
 * without dead-ends for kids.
 */

import Link from "next/link";

const LOOK_MODES = [
  {
    key: "classic",
    emoji: "🧺",
    label: "tap what you have",
    description: "pick from pictures",
    accent: "var(--wv-cornflower)",
    corners: "22px 28px 18px 26px",
    ready: true,
  },
  {
    key: "timer",
    emoji: "⏱️",
    label: "beat the clock",
    description: "how much can you grab?",
    accent: "var(--wv-teal)",
    corners: "26px 20px 28px 22px",
    ready: true,
  },
  {
    key: "nod-or-spin",
    emoji: "🙃",
    label: "nod or spin",
    description: "hold it up & be silly!",
    accent: "var(--wv-seafoam)",
    corners: "20px 26px 24px 28px",
    ready: true,
  },
  {
    key: "things",
    emoji: "🧲",
    label: "things that can…",
    description: "roll? float? stick?",
    accent: "var(--wv-cornflower)",
    corners: "28px 22px 26px 20px",
    ready: true,
  },
  {
    key: "scavenger",
    emoji: "🗺️",
    label: "scavenger hunt",
    description: "find the whole list!",
    accent: "var(--wv-navy)",
    corners: "22px 28px 18px 26px",
    ready: true,
  },
  {
    key: "colour-catcher",
    emoji: "📷",
    label: "colour catcher",
    description: "point at a colour!",
    accent: "var(--wv-redwood)",
    corners: "26px 20px 28px 22px",
    ready: true,
  },
  {
    key: "huff-puff",
    emoji: "💨",
    label: "huff & puff",
    description: "find it, then blow!",
    accent: "var(--wv-teal)",
    corners: "20px 26px 24px 28px",
    ready: true,
  },
  {
    key: "echo-finder",
    emoji: "🔊",
    label: "echo finder",
    description: "hear it, find it!",
    accent: "var(--wv-seafoam)",
    corners: "28px 22px 26px 20px",
    ready: true,
  },
] as const;

import { miniHref } from "@/lib/mini-pilot";
import { MiniStageHero } from "../stage-hero";

export default function MiniLookPage() {
  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .mini-look-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .mini-look-tile {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 140px;
          padding: 18px 12px;
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.08);
          border-radius: var(--corners);
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
          text-decoration: none;
          text-align: center;
          transition: scale 160ms cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 160ms ease;
        }
        a.mini-look-tile:hover {
          scale: 1.04;
          box-shadow: 0 6px 0 rgba(39, 50, 72, 0.1), 0 0 0 2px var(--accent);
        }
        a.mini-look-tile:active { scale: 0.95; }
        a.mini-look-tile:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-look-tile[data-soon="true"] {
          opacity: 0.55;
          pointer-events: none;
        }
        .mini-look-emoji { font-size: 40px; line-height: 1; }
        .mini-look-label {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: var(--wv-cadet);
          line-height: 1.2;
        }
        .mini-look-desc {
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
        }
        .mini-look-soon {
          position: absolute;
          top: 10px;
          right: 10px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 10px;
          color: var(--wv-white);
          background: var(--wv-sienna);
          border-radius: 8px 12px 8px 10px;
          padding: 2px 7px;
        }
        @media (prefers-reduced-motion: reduce) {
          a.mini-look-tile:hover, a.mini-look-tile:active { scale: 1; }
        }
      `}</style>

      <div className="mini-look-grid">
        {LOOK_MODES.map((mode) =>
          mode.ready ? (
            <Link
              key={mode.key}
              href={miniHref(`/look/${mode.key}`)}
              className="mini-look-tile"
              style={{
                ["--accent" as string]: mode.accent,
                ["--corners" as string]: mode.corners,
              }}
            >
              <span className="mini-look-emoji" aria-hidden="true">
                {mode.emoji}
              </span>
              <span className="mini-look-label">{mode.label}</span>
              <span className="mini-look-desc">{mode.description}</span>
            </Link>
          ) : (
            <div
              key={mode.key}
              className="mini-look-tile"
              data-soon="true"
              aria-disabled="true"
              style={{
                ["--accent" as string]: mode.accent,
                ["--corners" as string]: mode.corners,
              }}
            >
              <span className="mini-look-soon">soon</span>
              <span className="mini-look-emoji" aria-hidden="true">
                {mode.emoji}
              </span>
              <span className="mini-look-label">{mode.label}</span>
              <span className="mini-look-desc">{mode.description}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
