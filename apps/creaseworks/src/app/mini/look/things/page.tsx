"use client";

/**
 * mini look — "things that can…" — a multi-round property-lens hunt.
 *
 * Pick a property (roll, float, stick…), go find & log everything that
 * does it, then come BACK and pick another property — finds accumulate
 * across rounds until "done — let's make!". The property is a creativity
 * lens, not a filter: whatever a kid logs is right (the pilot's core
 * rule). Reuses FoundPicker via its onDone callback so each round adds to
 * the running collection. The union feeds the matcher.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FoundPicker } from "../found-picker";
import { MiniStageHero } from "../../stage-hero";
import { miniHref, saveFound } from "@/lib/mini-pilot";

const PROPERTIES = [
  { key: "roll", emoji: "⚪", accent: "var(--wv-cornflower)", corners: "22px 28px 18px 26px" },
  { key: "float", emoji: "🫧", accent: "var(--wv-teal)", corners: "26px 20px 28px 22px" },
  { key: "stick", emoji: "🩹", accent: "var(--wv-seafoam)", corners: "20px 26px 24px 28px" },
  { key: "stack", emoji: "🧱", accent: "var(--wv-navy)", corners: "28px 22px 26px 20px" },
  { key: "bend", emoji: "〰️", accent: "var(--wv-cornflower)", corners: "24px 20px 28px 22px" },
  { key: "make noise", emoji: "🔔", accent: "var(--wv-teal)", corners: "20px 28px 22px 26px" },
] as const;

export default function MiniThingsPage() {
  const router = useRouter();
  const [hunting, setHunting] = useState<string | null>(null);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [doneProps, setDoneProps] = useState<string[]>([]);

  const finishRound = useCallback(
    (picked: string[]) => {
      setCollected((prev) => {
        const next = new Set(prev);
        picked.forEach((t) => next.add(t));
        return next;
      });
      setDoneProps((prev) => (hunting && !prev.includes(hunting) ? [...prev, hunting] : prev));
      setHunting(null);
    },
    [hunting],
  );

  const finishAll = useCallback(() => {
    saveFound(Array.from(collected));
    router.push(miniHref("/make"));
  }, [collected, router]);

  if (hunting) {
    return (
      <div>
        <MiniStageHero stage="look" />
        <FoundPicker
          prompt={`find things that can ${hunting.toUpperCase()}!`}
          onDone={finishRound}
          doneLabel="add these! →"
        />
      </div>
    );
  }

  const hasFinds = collected.size > 0;

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
        .mini-things-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        button.mini-things-tile:not([type="submit"]):not(.wv-header-signout) {
          position: relative;
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
        .mini-things-done-chip {
          position: absolute; top: 8px; right: 8px;
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; color: var(--wv-white); background: var(--wv-teal);
        }
        .mini-things-finish {
          margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        button.mini-things-makebtn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 19px; color: var(--wv-white); background: var(--wv-redwood);
          border: none; border-radius: 22px 28px 20px 26px; padding: 16px 34px; cursor: pointer;
          box-shadow: 0 5px 0 rgba(39, 50, 72, 0.18);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-things-makebtn:active { scale: 0.96; }
        button.mini-things-makebtn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .mini-things-count {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--color-text-on-dark);
        }
        @media (prefers-reduced-motion: reduce) {
          button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):hover,
          button.mini-things-tile:not([type="submit"]):not(.wv-header-signout):active { scale: 1; }
        }
      `}</style>

      <p className="mini-things-prompt">
        {hasFinds ? "pick another — or you're all done!" : "pick one — then go find things that can do it!"}
      </p>

      <div className="mini-things-grid">
        {PROPERTIES.map((p) => (
          <button
            key={p.key}
            type="button"
            className="mini-things-tile"
            onClick={() => setHunting(p.key)}
            style={{
              ["--accent" as string]: p.accent,
              ["--corners" as string]: p.corners,
            }}
          >
            {doneProps.includes(p.key) && (
              <span className="mini-things-done-chip" aria-hidden="true">✓</span>
            )}
            <span className="mini-things-emoji" aria-hidden="true">{p.emoji}</span>
            <span className="mini-things-label">{p.key}</span>
          </button>
        ))}
      </div>

      {hasFinds && (
        <div className="mini-things-finish">
          <span className="mini-things-count">{collected.size} thing{collected.size === 1 ? "" : "s"} collected</span>
          <button type="button" className="mini-things-makebtn" onClick={finishAll}>
            done — let&rsquo;s make! →
          </button>
        </div>
      )}
    </div>
  );
}
