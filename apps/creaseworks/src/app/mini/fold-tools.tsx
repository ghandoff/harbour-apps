"use client";

/**
 * FoldTools — the fold-phase "need a hand?" layer (P0.3): a playful job wheel +
 * four scaffold buttons, now tucked inside ONE collapsed disclosure so the
 * default fold screen stays calm (post-launch polish). Opens on tap; if a
 * grown-up set "walk me through it" (the dial), it starts open with a hand up.
 *
 * The wheel draws only verbs the FOUND materials afford (fallback to the full
 * seed list), so the assigned job connects to what's actually on the table. It
 * never gates progress — it's an invitation, not a requirement. Both the wheel
 * and the scaffold buttons feed the mini-local trace (job_assigned, scaffold_tap).
 * Grown-up facilitation guidance lives in the grown-ups drawer, not here.
 */

import { useEffect, useMemo, useState } from "react";
import { MINI_ACTIVITY_EXTRAS, MINI_MATERIALS } from "@/lib/mini-data";
import { loadFound, loadDial, type MiniDial } from "@/lib/mini-pilot";
import { miniTrace } from "@/lib/cw-mini-trace";

const SEED_VERBS = [
  "mark", "join", "divide", "contain", "wrap", "stack", "transform",
  "launch", "carry", "sort", "hide", "reveal", "wear", "sound", "compare",
];
const MAT_BY_TITLE = new Map(MINI_MATERIALS.map((m) => [m.title, m] as const));
const SCAFFOLD_BUTTONS = [
  { key: "tellMore", label: "tell me more" },
  { key: "lessPlease", label: "less, please" },
  { key: "stuck", label: "I’m stuck" },
  { key: "sparkMe", label: "spark me" },
] as const;

export function FoldTools({ slug }: { slug: string }) {
  // wheel pool: verbs the found materials afford — fall back to the seed list
  const verbs = useMemo(() => {
    const set = new Set<string>();
    for (const t of loadFound()) for (const v of MAT_BY_TITLE.get(t)?.affords ?? []) set.add(v);
    return set.size >= 3 ? [...set] : SEED_VERBS;
  }, []);

  const [verb, setVerb] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  // the whole helper panel is collapsed by default — one calm "need a hand?"
  const [helpOpen, setHelpOpen] = useState(false);
  const [mountAt] = useState(() => (typeof performance !== "undefined" ? performance.now() : 0));

  // the ambiguity dial (P1.1): "walk me through it" opens the panel with a
  // starting hand; "point"/unset keeps it closed. Read after mount so SSR and
  // first client render match (both closed) — no hydration flip.
  const [dial, setDial] = useState<MiniDial | null>(null);
  useEffect(() => {
    const d = loadDial();
    setDial(d);
    if (d === "walk") {
      setHelpOpen(true);
      setOpen((cur) => cur ?? "sparkMe");
    }
  }, []);

  const scaffold = MINI_ACTIVITY_EXTRAS[slug]?.scaffold;

  function spin() {
    if (spinning || verbs.length === 0) return;
    setSpinning(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setVerb(verbs[Math.floor(Math.random() * verbs.length)]);
      if (++ticks >= 14) {
        clearInterval(iv);
        const landed = verbs[Math.floor(Math.random() * verbs.length)];
        setVerb(landed);
        setSpinning(false);
        miniTrace("job_assigned", { verb: landed, wheel_spun: true, playdate_slug: slug });
      }
    }, 80);
  }

  function tapScaffold(key: string) {
    setOpen((prev) => (prev === key ? null : key));
    miniTrace("scaffold_tap", {
      button: key,
      phase: "fold",
      seconds_into_phase: Math.round(((typeof performance !== "undefined" ? performance.now() : 0) - mountAt) / 1000),
      playdate_slug: slug,
    });
  }

  return (
    <div className="mini-fold-tools">
      <style>{`
        .mini-fold-tools { margin: 4px 0 18px; }
        /* one calm, collapsed entry point on the navy canvas */
        button.mini-help-toggle:not([type="submit"]):not(.wv-header-signout) {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-white);
          background: transparent; border: 1.5px dashed rgba(255, 255, 255, 0.55);
          border-radius: 16px 20px 14px 18px; padding: 12px 16px; cursor: pointer; text-align: left;
          transition: background 140ms ease;
        }
        button.mini-help-toggle:hover { background: rgba(255, 255, 255, 0.08); }
        button.mini-help-toggle:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-help-toggle-cue { font-size: 13px; font-weight: 800; opacity: 0.85; }
        .mini-help-panel { margin-top: 10px; }
        .mini-jobwheel {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          background: var(--wv-white); border: 2px solid rgba(39,50,72,0.1);
          border-radius: 18px 22px 16px 20px; padding: 12px 14px; margin-bottom: 12px;
        }
        button.mini-jobwheel-btn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-white); background: var(--wv-teal);
          border: none; border-radius: 14px 18px 12px 16px; padding: 10px 16px; cursor: pointer;
          transition: scale 120ms ease;
        }
        button.mini-jobwheel-btn:active { scale: 0.96; }
        button.mini-jobwheel-btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-jobwheel-verb {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 22px; color: var(--wv-cadet);
        }
        .mini-jobwheel-hint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: #6b7280;
        }
        .mini-scaffold-row { display: flex; flex-wrap: wrap; gap: 8px; }
        button.mini-scaffold-btn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet); background: var(--wv-white);
          border: 1.5px solid rgba(39,50,72,0.16); border-radius: 12px 15px 10px 13px; padding: 8px 13px; cursor: pointer;
        }
        button.mini-scaffold-btn[data-on="true"] {
          background: color-mix(in srgb, var(--wv-cornflower) 22%, var(--wv-white)); border-color: var(--wv-cornflower);
        }
        button.mini-scaffold-btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-scaffold-answer {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 14px; color: var(--wv-cadet); line-height: 1.5;
          background: var(--wv-white); border: 1.5px solid rgba(39,50,72,0.12);
          border-radius: 12px 16px 10px 14px; padding: 10px 13px; margin-top: 10px;
        }
        .mini-fold-dialhint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet); line-height: 1.4;
          background: color-mix(in srgb, var(--wv-seafoam) 26%, var(--wv-white));
          border-radius: 12px 15px 10px 13px; padding: 8px 12px; margin: 0 0 10px;
        }
      `}</style>

      <button
        type="button"
        className="mini-help-toggle"
        aria-expanded={helpOpen}
        onClick={() => setHelpOpen((o) => !o)}
      >
        <span>🙋 need a hand? · spin a job, or get unstuck</span>
        <span className="mini-help-toggle-cue" aria-hidden="true">{helpOpen ? "hide ▾" : "open ▸"}</span>
      </button>

      {helpOpen && (
        <div className="mini-help-panel">
          <div className="mini-jobwheel">
            <button type="button" className="mini-jobwheel-btn" onClick={spin} disabled={spinning}>
              🎡 {verb ? "spin again" : "spin the job wheel"}
            </button>
            {verb ? (
              <span className="mini-jobwheel-verb">give something a new job: <strong>{verb}</strong></span>
            ) : (
              <span className="mini-jobwheel-hint">optional — for a surprise job to try</span>
            )}
          </div>

          {scaffold && dial === "walk" && (
            <p className="mini-fold-dialhint">🗺️ you asked to be walked through it — here&rsquo;s a hand. tap any of these anytime.</p>
          )}

          {scaffold && (
            <>
              <div className="mini-scaffold-row">
                {SCAFFOLD_BUTTONS.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    className="mini-scaffold-btn"
                    data-on={open === b.key}
                    onClick={() => tapScaffold(b.key)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {open && (
                <p className="mini-scaffold-answer">{scaffold[open as keyof typeof scaffold]}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
