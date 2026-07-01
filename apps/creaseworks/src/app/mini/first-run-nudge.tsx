"use client";

/**
 * FirstRunNudge — make it unmissable that a grown-up must set the family /
 * class code BEFORE the first game.
 *
 * Without a code, a child's play traces and the kid/grown-up feedback land
 * anonymous (or not at all) — we lose exactly the attributed data the pilot
 * needs, especially from the collective this week. So a prominent banner
 * shows on every mini page until a code is saved, opening the grown-up
 * corner to set it. It clears the moment the code validates (the corner
 * dispatches `cw:code-set`); the banner asks the corner to open via
 * `cw:open-corner`. Kid-first is preserved — play isn't hard-blocked, but
 * setup is the obvious first move.
 */

import { useEffect, useState } from "react";
import { loadCode } from "@/lib/mini-pilot";

export function FirstRunNudge() {
  const [needsCode, setNeedsCode] = useState(false);

  useEffect(() => {
    const check = () => setNeedsCode(!loadCode());
    check();
    window.addEventListener("cw:code-set", check);
    return () => window.removeEventListener("cw:code-set", check);
  }, []);

  if (!needsCode) return null;

  return (
    <div className="cw-firstrun" role="note">
      <style>{`
        .cw-firstrun {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          background: color-mix(in srgb, var(--wv-mint) 55%, var(--wv-white));
          border: 2px solid var(--wv-teal);
          border-radius: 16px 20px 14px 18px;
          padding: 12px 14px; margin: 0 0 14px;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
        }
        .cw-firstrun-text { flex: 1; min-width: 200px; }
        .cw-firstrun-h {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 15px; color: var(--wv-cadet); margin: 0 0 2px;
        }
        .cw-firstrun-t {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 13px; line-height: 1.5; color: var(--wv-cadet); margin: 0;
        }
        .cw-firstrun-t strong { font-weight: 800; }
        button.cw-firstrun-btn:not([type="submit"]):not(.wv-header-signout) {
          cursor: pointer; white-space: nowrap;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-white);
          background: var(--wv-teal); border: none; border-radius: 14px 18px 12px 16px;
          padding: 11px 18px; box-shadow: 0 3px 0 rgba(39, 50, 72, 0.15);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.cw-firstrun-btn:hover { scale: 1.03; }
        button.cw-firstrun-btn:active { scale: 0.96; }
        button.cw-firstrun-btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { button.cw-firstrun-btn:hover, button.cw-firstrun-btn:active { scale: 1; } }
      `}</style>
      <div className="cw-firstrun-text">
        <p className="cw-firstrun-h">👋 grown-ups, start here</p>
        <p className="cw-firstrun-t">
          set your family or class code <strong>before the first game</strong> — so we can save what your child
          does and their feedback. (no code yet? make one up — anything memorable, like sunny-fox.)
        </p>
      </div>
      <button
        type="button"
        className="cw-firstrun-btn"
        onClick={() => window.dispatchEvent(new Event("cw:open-corner"))}
      >
        set up your code →
      </button>
    </div>
  );
}
