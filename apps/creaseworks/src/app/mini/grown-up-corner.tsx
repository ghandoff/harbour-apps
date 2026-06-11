"use client";

/**
 * GrownUpCorner — the in-context facilitator sheet.
 *
 * One small tab pinned to the left edge on every mini page; tapping it
 * slides up a sheet with guidance for the CURRENT stage, the family-code
 * entry, and a print link. Closing returns to the game — no navigation,
 * no second window, ever ("the last thing we want are kids and parents
 * not knowing which windows to be opened" — garrett).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiUrl } from "@/lib/api-url";
import { MINI_ACTIVITY_CONTENT } from "@/lib/mini-data";
import {
  getMiniStage,
  loadCode,
  loadFound,
  matchActivities,
  miniHref,
  miniStageFromPathname,
  saveCode,
  type MiniStageKey,
} from "@/lib/mini-pilot";

const WELCOME_GUIDE = [
  "a tiny pilot of creaseworks for ages 4–6: look (hunt for materials) → make → show → wow.",
  "your child drives. you hold the phone and read things aloud — resist instructing.",
  "spot a bug or a confusing moment? the 🐛 button (bottom-right) sends it straight to us.",
];

export function GrownUpCorner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"none" | "checking" | "ok" | "bad">("none");
  const [unfoldPrompt, setUnfoldPrompt] = useState<string | null>(null);

  const stageKey = miniStageFromPathname(pathname);
  const stage =
    stageKey && ["look", "make", "show", "wow"].includes(stageKey)
      ? getMiniStage(stageKey as MiniStageKey)
      : null;
  const lines = stage?.adultGuide ?? WELCOME_GUIDE;

  useEffect(() => {
    if (loadCode()) setCodeState("ok");
  }, []);

  // on show: surface the matched activity's unfold prompt for read-aloud
  useEffect(() => {
    if (stageKey !== "show") return setUnfoldPrompt(null);
    const found = loadFound();
    if (!found.length) return;
    const slug = matchActivities(found)[0].activity.slug;
    setUnfoldPrompt(MINI_ACTIVITY_CONTENT[slug]?.unfold ?? null);
  }, [stageKey]);

  async function checkCode() {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    setCodeState("checking");
    try {
      const res = await fetch(apiUrl("/api/mini/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      if (res.ok) {
        saveCode(trimmed);
        setCodeState("ok");
      } else setCodeState("bad");
    } catch {
      setCodeState("bad");
    }
  }

  return (
    <>
      <style>{`
        /* left-edge vertical tab — same pattern as the site's accessibility
           widget, and clear of the picker's bottom done-bar + the 🐛 at
           bottom-right */
        button.guc-tab:not([type="submit"]):not(.wv-header-signout) {
          position: fixed;
          left: 0;
          top: 50%;
          translate: 0 -50%;
          z-index: 45;
          writing-mode: vertical-rl;
          rotate: 180deg;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 12px;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.15);
          border-left: none;
          border-radius: 14px 0 0 14px;
          padding: 16px 7px 16px 9px;
          cursor: pointer;
          box-shadow: 2px 0 10px rgba(39, 50, 72, 0.12);
        }
        button.guc-tab:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        .guc-backdrop {
          position: fixed;
          inset: 0;
          z-index: 46;
          background: rgba(39, 50, 72, 0.35);
        }
        .guc-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 47;
          max-height: 72vh;
          overflow-y: auto;
          background: var(--wv-white);
          border-radius: 22px 22px 0 0;
          box-shadow: 0 -8px 30px rgba(39, 50, 72, 0.3);
          padding: 18px 20px calc(22px + env(safe-area-inset-bottom));
          animation: gucUp 240ms cubic-bezier(0.34, 1.3, 0.64, 1);
        }
        @keyframes gucUp { from { translate: 0 40%; opacity: 0.4; } to { translate: 0 0; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .guc-sheet { animation: none; } }
        .guc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .guc-head h2 {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 19px;
          color: var(--wv-cadet);
        }
        button.guc-close:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-white);
          background: var(--wv-cadet);
          border: none;
          border-radius: 12px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .guc-lines {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: var(--wv-cadet);
          margin: 0 0 14px 18px;
          list-style: disc;
        }
        .guc-lines li { margin-bottom: 7px; }
        .guc-readaloud {
          background: var(--tint, var(--wv-mint));
          border-radius: 14px;
          padding: 12px 14px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: var(--wv-cadet);
          margin-bottom: 14px;
        }
        .guc-readaloud strong { display: block; font-size: 12px; margin-bottom: 4px; }
        .guc-code {
          border-top: 1.5px solid rgba(39, 50, 72, 0.1);
          padding-top: 12px;
        }
        .guc-code-label {
          display: block;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--wv-cadet);
          margin-bottom: 6px;
        }
        .guc-code-row { display: flex; gap: 8px; }
        .guc-code-input {
          flex: 1;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          padding: 8px 12px;
          border: 1.5px solid rgba(39, 50, 72, 0.2);
          border-radius: 12px;
          background: var(--wv-white);
          color: var(--wv-cadet);
        }
        .guc-code-input:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }
        button.guc-code-save:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-white);
          background: var(--wv-navy);
          border: none;
          border-radius: 12px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .guc-code-ok {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--wv-cadet);
        }
        .guc-code-bad { font-size: 12px; color: var(--wv-redwood); margin-top: 6px; }
        .guc-print {
          display: inline-block;
          margin-top: 12px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 12px;
          color: var(--wv-cadet);
          text-decoration: underline;
        }
        @media print { .guc-tab, .guc-sheet, .guc-backdrop { display: none !important; } }
      `}</style>

      {!open && (
        <button
          type="button"
          className="guc-tab"
          onClick={() => setOpen(true)}
          aria-label="open the grown-up guide for this step"
        >
          ☝ for grown-ups
        </button>
      )}

      {open && (
        <>
          <div className="guc-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="guc-sheet"
            role="dialog"
            aria-label="grown-up guide"
            style={stage ? ({ ["--tint" as string]: stage.tint } as React.CSSProperties) : undefined}
          >
            <div className="guc-head">
              <h2>{stage ? `${stage.label} — for grown-ups` : "for grown-ups"}</h2>
              <button type="button" className="guc-close" onClick={() => setOpen(false)}>
                back to the game ↓
              </button>
            </div>

            <ul className="guc-lines">
              {lines.map((line) => (
                <li key={line.slice(0, 24)}>{line}</li>
              ))}
            </ul>

            {unfoldPrompt && (
              <div className="guc-readaloud">
                <strong>read this aloud:</strong>
                {unfoldPrompt}
              </div>
            )}

            <div className="guc-code">
              {codeState === "ok" ? (
                <p className="guc-code-ok">✓ family code saved — sharing is on.</p>
              ) : (
                <>
                  <label htmlFor="guc-code" className="guc-code-label">
                    family code (from us) — unlocks photo sharing:
                  </label>
                  <div className="guc-code-row">
                    <input
                      id="guc-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && checkCode()}
                      placeholder="sunny-fox"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="guc-code-input"
                    />
                    <button
                      type="button"
                      className="guc-code-save"
                      disabled={codeState === "checking"}
                      onClick={checkCode}
                    >
                      {codeState === "checking" ? "checking…" : "save"}
                    </button>
                  </div>
                  {codeState === "bad" && (
                    <p className="guc-code-bad">we don&rsquo;t recognise that one — check the spelling?</p>
                  )}
                </>
              )}
              <Link href={miniHref("/guide")} className="guc-print">
                printable version of the full guide
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
