"use client";

/**
 * mini make — choose a playdate, then play it.
 *
 * If the child collected materials in look, we auto-open the matched
 * playdate (the "82% match" payoff) — but the chooser is one tap away.
 * If they came straight to make (no materials), we open the chooser: all
 * five playdates with a one-line summary, so anyone who wants to just hang
 * out in make can pick freely. The read-aloud instructions render right
 * here (no second window); ordered steps break onto their own lines via
 * <ReadAloud>.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MiniStageHero } from "../stage-hero";
import { MINI_ACTIVITY_CONTENT } from "@/lib/mini-data";
import { logEvent } from "@/lib/cw-trace";
import { ReadAloud } from "../read-aloud";
import {
  loadFound,
  matchActivities,
  miniHref,
  saveSelected,
  MINI_ACTIVITIES,
  type MiniMatch,
} from "@/lib/mini-pilot";

export default function MiniMakePage() {
  const [matches, setMatches] = useState<MiniMatch[] | null>(null);
  const [hasFound, setHasFound] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const found = loadFound();
    setHasFound(found.length > 0);
    const m = matchActivities(found);
    setMatches(m);
    // came from look with a hunt → auto-open the match; else show the chooser
    if (found.length > 0) setSelectedSlug(m[0].activity.slug);
  }, []);

  const matched = hasFound && matches ? matches[0] : null;

  // trace every playdate opened (switching logs each open) + persist the
  // choice so the show stage attributes the reflection/eval/evidence to the
  // game the child actually played — not a re-guess from the matcher.
  useEffect(() => {
    if (selectedSlug) {
      saveSelected(selectedSlug);
      logEvent("activity_open", { stage: "make", activity: selectedSlug });
    }
  }, [selectedSlug]);

  const selected = selectedSlug ? MINI_ACTIVITIES.find((a) => a.slug === selectedSlug) ?? null : null;
  const isMatchedSelected = !!matched && selectedSlug === matched.activity.slug;
  const content = selectedSlug ? MINI_ACTIVITY_CONTENT[selectedSlug] : null;
  const foldText = content?.fold ?? null;
  const findText = content?.find ?? null;
  // show the "get set up" find step for fallback or a directly-chosen playdate
  const showFind = !isMatchedSelected || !!matched?.isFallback;
  const showChips = isMatchedSelected && (matched?.matched.length ?? 0) > 0;

  // chooser order: the matched playdate first
  const tiles = useMemo(() => {
    if (!matched) return MINI_ACTIVITIES;
    return [matched.activity, ...MINI_ACTIVITIES.filter((a) => a.slug !== matched.activity.slug)];
  }, [matched]);

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

        /* back-to-chooser link */
        button.mini-make-back:not([type="submit"]):not(.wv-header-signout) {
          background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 12px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 14px;
          color: var(--wv-white); text-decoration: underline; text-underline-offset: 3px;
        }
        button.mini-make-back:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: 6px; }

        /* the chooser */
        .mini-make-chooser-h {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 26px; color: var(--wv-white); margin: 4px 0 2px;
        }
        .mini-make-chooser-sub {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 15px; color: var(--wv-white); margin: 0 0 16px;
        }
        .mini-make-tiles { display: flex; flex-direction: column; gap: 12px; }
        button.mini-make-tile:not([type="submit"]):not(.wv-header-signout) {
          position: relative; text-align: left; cursor: pointer; background: var(--wv-white);
          border: 2.5px solid var(--accent); padding: 16px 18px;
          display: flex; flex-direction: column; gap: 4px; box-shadow: 0 4px 0 rgba(39, 50, 72, 0.08);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-make-tile:hover { scale: 1.02; }
        button.mini-make-tile:active { scale: 0.97; }
        button.mini-make-tile:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .mini-make-tile-title { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 20px; color: var(--wv-cadet); }
        .mini-make-tile-headline { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 14px; line-height: 1.4; color: #4b5563; }
        .mini-make-badge {
          align-self: flex-start; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 11px;
          color: var(--wv-white); background: var(--wv-redwood); border-radius: 10px 14px 9px 12px; padding: 3px 9px; margin-bottom: 2px;
        }

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
          a.mini-make-done:hover, a.mini-make-done:active,
          button.mini-make-tile:hover, button.mini-make-tile:active { scale: 1; }
        }
      `}</style>

      {selected ? (
        <>
          <button type="button" className="mini-make-back" onClick={() => setSelectedSlug(null)}>
            ← pick a different playdate
          </button>

          <div className="mini-make-card" style={{ ["--accent" as string]: selected.accent }}>
            <p className="mini-make-kicker">
              {isMatchedSelected
                ? matched?.isFallback
                  ? "whatever you collected is exactly right for…"
                  : `your stuff matches ${Math.round((matched?.score ?? 0) * 100)}% — let's play…`
                : "let's play…"}
            </p>
            <h2 className="mini-make-title">{selected.title}</h2>
            <p className="mini-make-headline">{selected.headline}</p>
            {showChips && (
              <div className="mini-make-chips" aria-label="things you found that we'll use">
                {matched!.matched.map((m) => (
                  <span key={m} className="mini-make-chip">
                    ✓ {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(findText || foldText) && (
            <div className="mini-make-steps">
              {showFind && findText && (
                <>
                  <h2>📣 read this aloud — get set up:</h2>
                  <ReadAloud text={findText} />
                </>
              )}
              {foldText && (
                <>
                  <h2>📣 read this aloud:</h2>
                  <ReadAloud text={foldText} />
                </>
              )}
            </div>
          )}

          <Link href={miniHref("/show")} className="mini-make-done">
            we made it! →
          </Link>
        </>
      ) : (
        <>
          <p className="mini-make-chooser-h">pick a playdate</p>
          <p className="mini-make-chooser-sub">tap one to see how to play.</p>
          <div className="mini-make-tiles">
            {tiles.map((a) => {
              const isMatch = matched?.activity.slug === a.slug;
              return (
                <button
                  key={a.slug}
                  type="button"
                  className="mini-make-tile"
                  style={{ ["--accent" as string]: a.accent, borderRadius: a.corners }}
                  onClick={() => setSelectedSlug(a.slug)}
                >
                  {isMatch && <span className="mini-make-badge">✨ matches your stuff</span>}
                  <span className="mini-make-tile-title">{a.title}</span>
                  <span className="mini-make-tile-headline">{a.headline}</span>
                  {a.outdoor && (
                    <span style={{ marginTop: 4, fontSize: 11, fontWeight: 800, color: "var(--wv-cadet)" }}>
                      best outside ☀️
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
