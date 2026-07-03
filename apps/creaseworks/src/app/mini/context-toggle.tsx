"use client";

/**
 * ContextToggle (P1.6) — one small, optional question at the start of the
 * find stage: where are you playing? 🏠 inside or 🌳 outside. The choice
 * swaps the find stage's "where to look" vocabulary (indoor drawers vs
 * outdoor paths) so the hunt fits the room the child is in.
 *
 * Never gates play — nothing is forced, and the hunt works with no choice
 * made. Stays re-selectable (a child can flip inside↔outside mid-sitting).
 * Choosing saves the context and logs context_set (family-code-keyed).
 *
 * SSR-safe: the current selection is read from sessionStorage in a useEffect
 * (starting null), never in a useState initializer or during render, so the
 * server and first client render agree — no hydration flip.
 */

import { useEffect, useState } from "react";
import { loadContext, saveContext, type MiniContext } from "@/lib/mini-pilot";
import { miniTrace } from "@/lib/cw-mini-trace";

const OPTIONS: Array<{ value: MiniContext; emoji: string; label: string }> = [
  { value: "indoor", emoji: "🏠", label: "inside" },
  { value: "outdoor", emoji: "🌳", label: "outside" },
];

export function ContextToggle() {
  const [context, setContext] = useState<MiniContext | null>(null);

  // read after mount so SSR and first client render match (both null) — the
  // reflected selection appears once we're on the client.
  useEffect(() => {
    setContext(loadContext());
  }, []);

  const choose = (c: MiniContext) => {
    saveContext(c);
    setContext(c);
    miniTrace("context_set", { choice: c });
  };

  return (
    <div className="cw-ctx" role="group" aria-label="where are you playing?">
      <style>{`
        .cw-ctx {
          display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px;
          margin: 0 0 12px;
        }
        .cw-ctx-q {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--color-text-on-dark);
          opacity: 0.92; margin: 0;
        }
        .cw-ctx-row { display: flex; gap: 8px; }
        button.cw-ctx-opt:not([type="submit"]):not(.wv-header-signout) {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-cadet);
          background: var(--wv-white); border: 2px solid rgba(39, 50, 72, 0.14);
          border-radius: 14px 18px 12px 16px; padding: 7px 13px;
          box-shadow: 0 2px 0 rgba(39, 50, 72, 0.1);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 140ms ease;
        }
        button.cw-ctx-opt[data-on="true"]:not([type="submit"]):not(.wv-header-signout) {
          border-color: var(--wv-teal);
          background: color-mix(in srgb, var(--wv-teal) 16%, var(--wv-white));
        }
        button.cw-ctx-opt:hover { scale: 1.03; }
        button.cw-ctx-opt:active { scale: 0.96; }
        button.cw-ctx-opt:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .cw-ctx-emoji { font-size: 17px; line-height: 1; }
        @media (prefers-reduced-motion: reduce) {
          button.cw-ctx-opt:hover, button.cw-ctx-opt:active { scale: 1; }
        }
      `}</style>
      <p className="cw-ctx-q">where are you playing?</p>
      <div className="cw-ctx-row">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className="cw-ctx-opt"
            data-on={context === o.value}
            aria-pressed={context === o.value}
            onClick={() => choose(o.value)}
          >
            <span className="cw-ctx-emoji" aria-hidden="true">{o.emoji}</span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
