"use client";

/**
 * Unfold-phase pieces (P0.4): the "show it, don't say it" guessing beat and a
 * flippable provocation card. Both are OPTIONAL and capture nothing but a trace
 * — the provocation has no answer field by design (the point is to wonder, not
 * to perform). Guesses happen out loud, in the room.
 */

import { useState } from "react";
import { MINI_ACTIVITY_EXTRAS } from "@/lib/mini-data";
import { miniTrace } from "@/lib/cw-mini-trace";

const now = () => (typeof performance !== "undefined" ? performance.now() : 0);

export function GuessBeat({ slug }: { slug: string | null }) {
  const [done, setDone] = useState<"guessed" | "stumped" | null>(null);
  const tap = (kind: "guessed" | "stumped") => {
    setDone(kind);
    miniTrace("guess_event", { playdate_slug: slug, kind });
  };
  return (
    <div className="mini-guess">
      <style>{`
        .mini-guess { margin: 4px 0 14px; }
        .mini-guess-hint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13.5px; color: var(--wv-cadet); line-height: 1.5; margin: 2px 0 10px;
        }
        .mini-guess-btns { display: flex; flex-wrap: wrap; gap: 8px; }
        button.mini-guess-btn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet); background: var(--wv-white);
          border: 1.5px solid rgba(39,50,72,0.16); border-radius: 12px 15px 10px 13px; padding: 8px 13px; cursor: pointer;
        }
        button.mini-guess-btn[data-on="true"] { background: color-mix(in srgb, var(--wv-seafoam) 30%, var(--wv-white)); border-color: var(--wv-teal); }
        button.mini-guess-btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
      `}</style>
      <p className="mini-show-section">🙊 show it, don’t say it — let them guess</p>
      <p className="mini-guess-hint">
        before you type anything: show the creation to someone and let them <em>guess</em> what it
        does. don’t tell them! (totally optional.)
      </p>
      <div className="mini-guess-btns">
        <button type="button" className="mini-guess-btn" data-on={done === "guessed"} onClick={() => tap("guessed")}>
          they guessed it! 🎉
        </button>
        <button type="button" className="mini-guess-btn" data-on={done === "stumped"} onClick={() => tap("stumped")}>
          stumped them! 🤔
        </button>
      </div>
    </div>
  );
}

export function ProvocationCard({ slug }: { slug: string | null }) {
  const provs = (slug && MINI_ACTIVITY_EXTRAS[slug]?.provocations) || [];
  const [idx] = useState(() => (provs.length ? Math.floor(Math.random() * provs.length) : 0));
  const [flipped, setFlipped] = useState(false);
  const [shownAt] = useState(() => now());
  if (!provs.length) return null;

  const flip = () => {
    setFlipped(true);
    miniTrace("provocation_flip", { playdate_slug: slug, dwell_ms: Math.round(now() - shownAt) });
  };

  return (
    <div className="mini-prov">
      <style>{`
        .mini-prov {
          background: color-mix(in srgb, var(--wv-plum, #7c6aa8) 12%, var(--wv-white));
          border: 1.5px solid rgba(39,50,72,0.12); border-radius: 16px 20px 14px 18px;
          padding: 14px 16px; margin: 6px 0 16px;
        }
        .mini-prov-q {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 17px;
          color: var(--wv-cadet); line-height: 1.4;
        }
        button.mini-prov-flip:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet); background: transparent;
          border: none; padding: 8px 0 0; cursor: pointer; text-decoration: underline;
        }
        button.mini-prov-flip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-prov-note {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: #6b7280; margin-top: 8px;
        }
      `}</style>
      <p className="mini-prov-q">🌀 {provs[idx]}</p>
      {!flipped ? (
        <button type="button" className="mini-prov-flip" onClick={flip}>just wonder about it →</button>
      ) : (
        <p className="mini-prov-note">no need to answer — just let it sit. that’s the whole point.</p>
      )}
    </div>
  );
}
