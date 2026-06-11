"use client";

/**
 * mini look — "things that can…" — a property-lens hunt.
 *
 * Kid picks a property (roll, float, stick, stack, bend, make noise),
 * then goes hunting for everyday things that can do it. The property is
 * a creativity LENS, not a filter — whatever they bring back gets logged
 * through the shared FoundPicker, so there are no wrong answers (the
 * pilot's core rule). Logged materials feed the same matcher.
 */

import { useState } from "react";
import { FoundPicker } from "../found-picker";
import { MiniStageHero } from "../../stage-hero";

const PROPERTIES = [
  { key: "roll", emoji: "⚪", accent: "var(--wv-cornflower)", corners: "22px 28px 18px 26px" },
  { key: "float", emoji: "🫧", accent: "var(--wv-teal)", corners: "26px 20px 28px 22px" },
  { key: "stick", emoji: "🩹", accent: "var(--wv-seafoam)", corners: "20px 26px 24px 28px" },
  { key: "stack", emoji: "🧱", accent: "var(--wv-navy)", corners: "28px 22px 26px 20px" },
  { key: "bend", emoji: "〰️", accent: "var(--wv-cornflower)", corners: "24px 20px 28px 22px" },
  { key: "make noise", emoji: "🔔", accent: "var(--wv-teal)", corners: "20px 28px 22px 26px" },
] as const;

export default function MiniThingsPage() {
  const [prop, setProp] = useState<string | null>(null);

  if (prop) {
    return (
      <div>
        <MiniStageHero stage="look" />
        <FoundPicker prompt={`find things that can ${prop.toUpperCase()}!`} />
      </div>
    );
  }

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .mini-things-prompt {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--color-text-on-dark);
          text-align: center;
          margin-bottom: 16px;
          line-height: 1.4;
        }
        .mini-things-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        button.mini-things-tile:not([type="submit"]):not(.wv-header-signout) {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 120px;
          padding: 18px 12px;
          background: var(--wv-white);
          border: 2.5px solid var(--accent);
          border-radius: var(--corners);
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.1);
          cursor: pointer;
          transition: scale 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):hover { scale: 1.04; }
        button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):active { scale: 0.95; }
        button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-things-emoji { font-size: 44px; line-height: 1; }
        .mini-things-label {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--wv-cadet);
        }
        @media (prefers-reduced-motion: reduce) {
          button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):hover,
          button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):active { scale: 1; }
        }
      `}</style>

      <p className="mini-things-prompt">pick one — then go find things that can do it!</p>

      <div className="mini-things-grid">
        {PROPERTIES.map((p) => (
          <button
            key={p.key}
            type="button"
            className="mini-things-tile"
            onClick={() => setProp(p.key)}
            style={{
              ["--accent" as string]: p.accent,
              ["--corners" as string]: p.corners,
            }}
          >
            <span className="mini-things-emoji" aria-hidden="true">
              {p.emoji}
            </span>
            <span className="mini-things-label">{p.key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
