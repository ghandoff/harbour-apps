"use client";

/**
 * GrownupCard (P1.3) — a per-playdate, grown-up-ONLY reference card that flips
 * to reveal the theory behind the play. It lives inside the grown-up corner and
 * is NEVER shown on a child surface, so it's the one place theory language is
 * allowed — kept about the PLAY and facilitation, never about grading the child.
 *
 *   front — what to notice / what this play is really doing
 *   back  — the theory in plain language + one concrete facilitation tip
 *
 * Reference only: it flips on tap/click, logs nothing, captures nothing. If a
 * slug has no grownupCard, it renders nothing.
 */

import { useState } from "react";
import { MINI_ACTIVITY_EXTRAS } from "@/lib/mini-data";

export function GrownupCard({ slug }: { slug: string }) {
  const [flipped, setFlipped] = useState(false);
  const card = MINI_ACTIVITY_EXTRAS[slug]?.grownupCard;
  if (!card) return null;

  return (
    <div className="guc-card">
      <style>{`
        .guc-card {
          border-top: 1.5px solid rgba(39, 50, 72, 0.1);
          padding-top: 14px;
          margin-top: 12px;
        }
        .guc-card-eyebrow {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--wv-teal);
          margin: 0 0 8px;
        }
        button.guc-card-flip:not([type="submit"]):not(.wv-header-signout) {
          display: block;
          width: 100%;
          text-align: left;
          cursor: pointer;
          background: var(--wv-seafoam);
          border: 2px solid rgba(39, 50, 72, 0.14);
          border-radius: 18px 22px 16px 20px;
          padding: 14px 16px;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1), background 160ms ease;
        }
        button.guc-card-flip[data-flipped="true"] {
          background: var(--wv-mint);
        }
        button.guc-card-flip:hover { scale: 1.01; }
        button.guc-card-flip:active { scale: 0.98; }
        button.guc-card-flip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .guc-card-side {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          line-height: 1.6;
          color: var(--wv-cadet);
          margin: 0;
        }
        .guc-card-cue {
          display: block;
          margin-top: 10px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 12.5px;
          color: var(--wv-teal);
        }
        @media (prefers-reduced-motion: reduce) {
          button.guc-card-flip { transition: background 160ms ease; }
          button.guc-card-flip:hover, button.guc-card-flip:active { scale: 1; }
        }
      `}</style>

      <p className="guc-card-eyebrow">the why — for grown-ups only</p>
      <button
        type="button"
        className="guc-card-flip"
        data-flipped={flipped}
        aria-expanded={flipped}
        onClick={() => setFlipped((f) => !f)}
      >
        <p className="guc-card-side">{flipped ? card.back : card.front}</p>
        <span className="guc-card-cue">{flipped ? "← back to what to notice" : "flip for the why →"}</span>
      </button>
    </div>
  );
}
