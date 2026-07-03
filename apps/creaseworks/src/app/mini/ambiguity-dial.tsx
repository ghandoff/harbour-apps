"use client";

/**
 * AmbiguityDial (P1.1) — one gentle question at the start of a sitting:
 * how much help do you want? "let me figure it out" (low scaffold) or "walk
 * me through it" (more help up front). It sets the fold workshop's default
 * scaffold depth — it NEVER gates play, and either way every tool stays
 * available. Optional: "just start" skips it.
 *
 * Shows once per session, only AFTER a family code is set (so it never
 * competes with the FirstRunNudge "set your code" banner), and disappears
 * once chosen or skipped. Choosing logs ambiguity_set (family-code-keyed).
 */

import { useEffect, useState } from "react";
import { loadCode, loadDial, saveDial, type MiniDial } from "@/lib/mini-pilot";
import { miniTrace } from "@/lib/cw-mini-trace";

const SKIP_KEY = "cw-mini-dial-skipped";

export function AmbiguityDial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      let skipped = false;
      try {
        skipped = sessionStorage.getItem(SKIP_KEY) === "1";
      } catch {}
      setShow(!!loadCode() && !loadDial() && !skipped);
    };
    check();
    window.addEventListener("cw:code-set", check);
    return () => window.removeEventListener("cw:code-set", check);
  }, []);

  if (!show) return null;

  const choose = (mode: MiniDial) => {
    saveDial(mode);
    miniTrace("ambiguity_set", { choice: mode });
    setShow(false);
  };

  const skip = () => {
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {}
    setShow(false);
  };

  return (
    <div className="cw-dial" role="group" aria-label="how much help do you want?">
      <style>{`
        .cw-dial {
          background: var(--wv-white);
          border: 2px solid rgba(39, 50, 72, 0.12);
          border-radius: 18px 22px 16px 20px;
          padding: 14px 16px; margin: 0 0 14px;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
        }
        .cw-dial-q {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 18px;
          color: var(--wv-cadet); margin: 0 0 10px; line-height: 1.25;
        }
        .cw-dial-row { display: flex; flex-wrap: wrap; gap: 10px; }
        button.cw-dial-opt:not([type="submit"]):not(.wv-header-signout) {
          flex: 1; min-width: 150px; text-align: left; cursor: pointer;
          background: var(--wv-white); border: 2px solid var(--wv-teal);
          border-radius: 16px 20px 14px 18px; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 2px;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.1);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.cw-dial-opt:hover { scale: 1.02; }
        button.cw-dial-opt:active { scale: 0.97; }
        button.cw-dial-opt:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .cw-dial-opt-t {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 15px; color: var(--wv-cadet);
        }
        .cw-dial-opt-d {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 12px; color: #6b7280; line-height: 1.35;
        }
        button.cw-dial-skip:not([type="submit"]):not(.wv-header-signout) {
          margin-top: 8px; background: none; border: none; padding: 4px 2px; cursor: pointer;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 12.5px; color: #6b7280;
          text-decoration: underline; text-underline-offset: 3px;
        }
        button.cw-dial-skip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { button.cw-dial-opt:hover, button.cw-dial-opt:active { scale: 1; } }
      `}</style>
      <p className="cw-dial-q">how do you want to play today?</p>
      <div className="cw-dial-row">
        <button type="button" className="cw-dial-opt" onClick={() => choose("point")}>
          <span className="cw-dial-opt-t">🧭 let me figure it out</span>
          <span className="cw-dial-opt-d">just point me at it — I&rsquo;ll find my own way.</span>
        </button>
        <button type="button" className="cw-dial-opt" onClick={() => choose("walk")}>
          <span className="cw-dial-opt-t">🗺️ walk me through it</span>
          <span className="cw-dial-opt-d">show me a hand when I want one.</span>
        </button>
      </div>
      <button type="button" className="cw-dial-skip" onClick={skip}>
        just start →
      </button>
    </div>
  );
}
