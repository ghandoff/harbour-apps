"use client";

/**
 * mini make — the activity reveal + instructions, all on one page.
 *
 * The matcher picks the activity; the read-aloud instructions (the
 * activity's fold-phase text, snapshotted from the db) render right
 * here — no links to other pages, no second window. The grown-up
 * corner carries the facilitation tips.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { MiniStageHero } from "../stage-hero";
import { MINI_ACTIVITY_CONTENT } from "@/lib/mini-data";
import { logEvent } from "@/lib/cw-trace";
import {
  loadFound,
  matchActivities,
  miniHref,
  type MiniMatch,
} from "@/lib/mini-pilot";

export default function MiniMakePage() {
  const [matches, setMatches] = useState<MiniMatch[] | null>(null);

  useEffect(() => {
    setMatches(matchActivities(loadFound()));
  }, []);

  const best = matches?.[0];

  // trace which playdate the match-rate surfaced — the activity_open signal
  // (the stage-level stage_enter is emitted by the shell's TraceProbe)
  useEffect(() => {
    if (best) logEvent("activity_open", { stage: "make", activity: best.activity.slug });
  }, [best?.activity.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  const foldText = best ? MINI_ACTIVITY_CONTENT[best.activity.slug]?.fold : null;
  const findText = best ? MINI_ACTIVITY_CONTENT[best.activity.slug]?.find : null;

  return (
    <div>
      <MiniStageHero stage="make" />

      <style>{`
        .mini-make-card {
          background: var(--wv-white);
          border: 2.5px solid var(--accent);
          border-radius: 24px 30px 22px 28px;
          padding: 20px;
          margin-bottom: 16px;
          animation: miniMakeIn 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes miniMakeIn {
          from { opacity: 0; translate: 0 10px; scale: 0.94; }
          to   { opacity: 1; translate: 0 0; scale: 1; }
        }
        .mini-make-kicker {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-navy);
          letter-spacing: 0.03em;
          margin-bottom: 6px;
        }
        .mini-make-title {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 28px;
          color: var(--wv-cadet);
          margin-bottom: 6px;
          line-height: 1.15;
        }
        .mini-make-headline {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: var(--wv-cadet);
          line-height: 1.45;
          margin-bottom: 14px;
        }
        .mini-make-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .mini-make-chip {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--wv-cadet);
          background: color-mix(in srgb, var(--accent) 18%, var(--wv-white));
          border: 2px solid var(--accent);
          border-radius: 12px 16px 10px 14px;
          padding: 5px 11px;
        }
        .mini-make-steps {
          background: var(--wv-mint);
          border-radius: 20px 26px 18px 24px;
          padding: 18px 20px;
          margin-bottom: 18px;
        }
        .mini-make-steps h2 {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.04em;
          color: var(--wv-cadet);
          margin-bottom: 8px;
        }
        .mini-make-steps p {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 17px;
          line-height: 1.6;
          color: var(--wv-cadet);
        }
        .mini-make-steps p + h2 { margin-top: 14px; }
        a.mini-make-done {
          display: inline-block;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border-radius: 22px 28px 20px 26px;
          padding: 16px 34px;
          text-decoration: none;
          box-shadow: 0 5px 0 rgba(39, 50, 72, 0.18);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        a.mini-make-done:hover { scale: 1.04; }
        a.mini-make-done:active { scale: 0.95; }
        a.mini-make-done:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mini-make-card { animation: none; }
          a.mini-make-done:hover, a.mini-make-done:active { scale: 1; }
        }
      `}</style>

      {best && (
        <>
          <div
            className="mini-make-card"
            style={{ ["--accent" as string]: best.activity.accent }}
          >
            <p className="mini-make-kicker">
              {best.isFallback
                ? "whatever you collected is exactly right for…"
                : `your stuff matches ${Math.round(best.score * 100)}% — let's play…`}
            </p>
            <h2 className="mini-make-title">{best.activity.title}</h2>
            <p className="mini-make-headline">{best.activity.headline}</p>
            {best.matched.length > 0 && (
              <div className="mini-make-chips" aria-label="things you found that we'll use">
                {best.matched.map((m) => (
                  <span key={m} className="mini-make-chip">
                    ✓ {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(findText || foldText) && (
            <div className="mini-make-steps">
              {best.isFallback && findText && (
                <>
                  <h2>📣 read this aloud — get set up:</h2>
                  <p>{findText}</p>
                </>
              )}
              {foldText && (
                <>
                  <h2>📣 read this aloud:</h2>
                  <p>{foldText}</p>
                </>
              )}
            </div>
          )}

          <Link href={miniHref("/show")} className="mini-make-done">
            we made it! →
          </Link>
        </>
      )}
    </div>
  );
}
