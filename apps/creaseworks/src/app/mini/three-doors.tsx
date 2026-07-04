"use client";

/**
 * ThreeDoors (P1.2) — three ways INTO the same playdate, chosen on fold:
 *   🔨 build it     — make it real: strong, tall, finished, working
 *   💥 break it     — take it apart, test it, change one piece and watch
 *   📖 tell its story — who is it? where from? what happens next?
 *
 * A door reframes the SAME materials + playdate — it never forks the flow or
 * gates progress; ignore it and the steps below still work. Picking one shows
 * its invitation and logs door_chosen (family-code-keyed, no verdict).
 *
 * Content is generic v1 (works for any playdate); a playdate can override with
 * its own MINI_ACTIVITY_EXTRAS[slug].doors later (flagged for the team).
 */

import { useState } from "react";
import { MINI_ACTIVITY_EXTRAS } from "@/lib/mini-data";
import { miniTrace } from "@/lib/cw-mini-trace";

type DoorKey = "build" | "break" | "story";

const GENERIC: Record<DoorKey, { emoji: string; label: string; invite: string }> = {
  build: {
    emoji: "🔨",
    label: "build it",
    invite: "make it as real as you can — strong, tall, finished. does it actually work?",
  },
  break: {
    emoji: "💥",
    label: "break it",
    invite: "take it apart. what’s inside? change one piece — or push it too far — and watch what happens.",
  },
  story: {
    emoji: "📖",
    label: "tell its story",
    invite: "who is it? where did it come from? what happens to it next?",
  },
};

const ORDER: DoorKey[] = ["build", "break", "story"];

export function ThreeDoors({ slug }: { slug: string }) {
  const [chosen, setChosen] = useState<DoorKey | null>(null);
  const override = MINI_ACTIVITY_EXTRAS[slug]?.doors;

  const invite = (k: DoorKey) => override?.[k] ?? GENERIC[k].invite;

  const choose = (k: DoorKey) => {
    setChosen(k);
    miniTrace("door_chosen", { playdate_slug: slug, door: k });
  };

  return (
    <div className="mini-doors">
      <style>{`
        .mini-doors { margin: 4px 0 16px; }
        .mini-doors-q {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--color-text-on-dark); margin: 0 0 8px;
        }
        .mini-doors-row { display: flex; flex-wrap: wrap; gap: 8px; }
        button.mini-door:not([type="submit"]):not(.wv-header-signout) {
          flex: 1; min-width: 96px; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: var(--wv-white); border: 2px solid rgba(39, 50, 72, 0.14);
          border-radius: 16px 20px 14px 18px; padding: 12px 8px;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 140ms ease;
        }
        button.mini-door:hover { scale: 1.03; }
        button.mini-door:active { scale: 0.96; }
        button.mini-door[data-on="true"] {
          border-color: var(--wv-redwood);
          background: color-mix(in srgb, var(--wv-redwood) 10%, var(--wv-white));
        }
        button.mini-door:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .mini-door-emoji { font-size: 26px; line-height: 1; }
        .mini-door-label {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet);
        }
        .mini-door-invite {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 14px; color: var(--wv-cadet); line-height: 1.5;
          background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.12);
          border-radius: 14px 18px 12px 16px; padding: 10px 13px; margin-top: 10px;
        }
        @media (prefers-reduced-motion: reduce) { button.mini-door:hover, button.mini-door:active { scale: 1; } }
      `}</style>

      <p className="mini-doors-q">how do you want to play with it? (pick one — or just start)</p>
      <div className="mini-doors-row">
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className="mini-door"
            data-on={chosen === k}
            onClick={() => choose(k)}
          >
            <span className="mini-door-emoji" aria-hidden="true">{GENERIC[k].emoji}</span>
            <span className="mini-door-label">{GENERIC[k].label}</span>
          </button>
        ))}
      </div>
      {chosen && <p className="mini-door-invite">{GENERIC[chosen].emoji} {invite(chosen)}</p>}
    </div>
  );
}
