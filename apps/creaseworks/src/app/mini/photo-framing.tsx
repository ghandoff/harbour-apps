"use client";

/**
 * PhotoFraming (P1.7) — gentle, optional framing tips beside the photo input on
 * the unfold (show) stage, so the creation photo comes out useful for the family
 * + the shared wall. Pictures over words: four tiny tips (fill the frame, face a
 * window, plain background, hold steady).
 *
 * Guidance ONLY — it never touches the photo input, never captures, and logs
 * nothing. A collapsible "photo tips" toggle that defaults CLOSED so the input
 * keeps working with zero reading; opening it just reveals the hint strip.
 */

import { useState } from "react";

const TIPS: { emoji: string; label: string }[] = [
  { emoji: "🔍", label: "get close — fill the frame" },
  { emoji: "🪟", label: "face a window for good light" },
  { emoji: "🧺", label: "clear the background" },
  { emoji: "🤝", label: "hold steady" },
];

export function PhotoFraming() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mini-frame">
      <style>{`
        .mini-frame { margin: -6px 0 14px; }
        button.mini-frame-toggle:not([type="submit"]):not(.wv-header-signout) {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet);
          background: color-mix(in srgb, var(--wv-sun) 22%, var(--wv-white));
          border: 1.5px solid rgba(39, 50, 72, 0.14);
          border-radius: 12px 16px 10px 14px; padding: 7px 13px;
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-frame-toggle:hover { scale: 1.03; }
        button.mini-frame-toggle:active { scale: 0.97; }
        button.mini-frame-toggle:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .mini-frame-caret { font-size: 11px; transition: transform 160ms ease; }
        .mini-frame-caret[data-open="true"] { transform: rotate(180deg); }
        .mini-frame-strip {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
        }
        .mini-frame-tip {
          flex: 1; min-width: 128px;
          display: flex; align-items: center; gap: 8px;
          background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.12);
          border-radius: 14px 18px 12px 16px; padding: 9px 12px;
        }
        .mini-frame-tip-emoji { font-size: 22px; line-height: 1; }
        .mini-frame-tip-label {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--wv-cadet); line-height: 1.4;
        }
        @media (prefers-reduced-motion: reduce) {
          button.mini-frame-toggle:hover, button.mini-frame-toggle:active { scale: 1; }
          .mini-frame-caret { transition: none; }
        }
      `}</style>

      <button
        type="button"
        className="mini-frame-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mini-frame-tips"
      >
        <span aria-hidden="true">📸</span>
        photo tips
        <span className="mini-frame-caret" data-open={open} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="mini-frame-strip" id="mini-frame-tips" role="group" aria-label="optional photo tips">
          {TIPS.map((t) => (
            <div className="mini-frame-tip" key={t.label}>
              <span className="mini-frame-tip-emoji" aria-hidden="true">{t.emoji}</span>
              <span className="mini-frame-tip-label">{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
