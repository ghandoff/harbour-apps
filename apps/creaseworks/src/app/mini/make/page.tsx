"use client";

/**
 * mini make — the activity reveal.
 *
 * Reads the look haul from sessionStorage, runs the client-side
 * match-rate against the five pilot activities, and reveals the winner
 * with its matched materials as a visual checklist. When nothing
 * matches well, character-from-a-crease catches it — "whatever you
 * collect is right."
 *
 * The full picture+audio step-by-step guide is the next layer of this
 * slice; for now the reveal links the facilitating adult to the full
 * guide on the main app, and "we made it!" carries the family to show.
 *
 * sessionStorage is read in an effect (not render) so the server render
 * and first client render agree — avoids a hydration mismatch.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { MiniStageHero } from "../stage-hero";
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
  const runnerUp = matches?.[1];

  return (
    <div>
      <MiniStageHero stage="make" />

      <style>{`
        .mini-make-card {
          background: var(--wv-white);
          border: 2px solid var(--accent);
          border-radius: 24px 30px 22px 28px;
          padding: 22px 20px;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.1);
          animation: miniMakeIn 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes miniMakeIn {
          from { opacity: 0; translate: 0 10px; scale: 0.94; }
          to   { opacity: 1; translate: 0 0; scale: 1; }
        }
        .mini-make-kicker {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .mini-make-title {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 26px;
          color: var(--wv-cadet);
          margin-bottom: 6px;
        }
        .mini-make-headline {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--wv-cadet);
          opacity: 0.75;
          line-height: 1.45;
          margin-bottom: 16px;
        }
        .mini-make-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
        .mini-make-chip {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 12px;
          color: var(--wv-cadet);
          background: color-mix(in srgb, var(--accent) 16%, var(--wv-white));
          border: 1.5px solid var(--accent);
          border-radius: 12px 16px 10px 14px;
          padding: 4px 10px;
        }
        button.mini-make-done:not([type="submit"]):not(.wv-header-signout),
        a.mini-make-done {
          display: inline-block;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 20px 26px 18px 24px;
          padding: 14px 30px;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.15);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        a.mini-make-done:hover { scale: 1.04; }
        a.mini-make-done:active { scale: 0.95; }
        a.mini-make-done:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-make-meta {
          margin-top: 16px;
          font-size: 12px;
          color: var(--wv-cadet);
          opacity: 0.5;
          line-height: 1.6;
        }
        .mini-make-meta a { text-decoration: underline; }
        @media (prefers-reduced-motion: reduce) {
          .mini-make-card { animation: none; }
          a.mini-make-done:hover, a.mini-make-done:active { scale: 1; }
        }
      `}</style>

      {best && (
        <div
          className="mini-make-card"
          style={{ ["--accent" as string]: best.activity.accent }}
        >
          <p className="mini-make-kicker">
            {best.isFallback
              ? "whatever you collected is exactly right for…"
              : best.matched.length > 0
                ? `your stuff matches ${Math.round(best.score * 100)}% — let's play…`
                : "let's play…"}
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

          <Link href={miniHref("/show")} className="mini-make-done">
            we made it! →
          </Link>

          <p className="mini-make-meta">
            grown-ups: the full step-by-step guide is on{" "}
            <a
              href={`https://windedvertigo.com/harbour/creaseworks/sampler/${best.activity.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              the main creaseworks site
            </a>
            {runnerUp && runnerUp.matched.length >= 2 && (
              <>
                {" "}
                · also a good fit: <strong>{runnerUp.activity.title}</strong>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
