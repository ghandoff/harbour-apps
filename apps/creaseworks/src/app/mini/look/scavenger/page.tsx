"use client";

/**
 * mini look — "scavenger hunt" — a PROPER hunt (the old one skipped the
 * finding entirely; this gives a real checklist to complete).
 *
 * The app deals a 6-item hunt card plus a silly way to move (hop, tiptoe,
 * crawl…) — preschool scavenger hunts work best when the search is paired
 * with locomotion (ACM embodied-play review, 2022). Kids find each thing
 * and tap it off; finishing the whole card earns a celebration. Forgiving
 * by design: "done" works any time with whatever's checked, and "new
 * hunt" re-deals if the list doesn't fit what's around. Checked items feed
 * the matcher like every other look mode.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterSlot, { resolveCharacterFromForm } from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { MINI_MATERIALS, type MiniMaterial } from "@/lib/mini-data";
import { MINI_AT_ROOT, miniHref, saveFound } from "@/lib/mini-pilot";
import { traceMaterialsPicked } from "@/lib/cw-mini-trace";
import { MiniStageHero } from "../../stage-hero";

const ICON_BASE = MINI_AT_ROOT ? "/harbour/creaseworks-mini" : "/harbour/creaseworks";
const HUNT_SIZE = 6;

const MOVES = [
  { word: "hopping", emoji: "🐰" },
  { word: "tiptoeing", emoji: "🤫" },
  { word: "crawling", emoji: "🐛" },
  { word: "stomping", emoji: "🦖" },
  { word: "wiggling", emoji: "🪱" },
  { word: "marching", emoji: "🥁" },
  { word: "zooming", emoji: "🚀" },
] as const;

function shuffle(a: MiniMaterial[]) {
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

function dealHunt() {
  const pool = shuffle([...MINI_MATERIALS]);
  // guarantee the card carries the loud/quiet contrast — seed one of each,
  // then fill the rest and reshuffle so the seeds aren't always first.
  const loud = pool.find((m) => m.loudQuiet === "loud");
  const quiet = pool.find((m) => m.loudQuiet === "quiet");
  const seed = [loud, quiet].filter((m): m is MiniMaterial => !!m);
  const seedIds = new Set(seed.map((m) => m.id));
  const card = shuffle([...seed, ...pool.filter((m) => !seedIds.has(m.id))].slice(0, HUNT_SIZE));
  const move = MOVES[Math.floor(Math.random() * MOVES.length)];
  return { card, move };
}

export default function MiniScavengerPage() {
  const router = useRouter();
  const variant = useCharacterVariant();

  // deterministic first paint (no SSR mismatch); real hunt dealt on mount
  const [card, setCard] = useState<MiniMaterial[]>(MINI_MATERIALS.slice(0, HUNT_SIZE));
  const [move, setMove] = useState<(typeof MOVES)[number]>(MOVES[0]);
  const [found, setFound] = useState<Set<string>>(new Set());

  const reroll = useCallback(() => {
    const h = dealHunt();
    setCard(h.card);
    setMove(h.move);
    setFound(new Set());
  }, []);

  useEffect(() => {
    reroll();
  }, [reroll]);

  const toggle = useCallback((title: string) => {
    setFound((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const done = useCallback(() => {
    const picked = card.filter((m) => found.has(m.title));
    saveFound(picked.map((m) => m.title));
    traceMaterialsPicked("scavenger", picked);
    router.push(miniHref("/make"));
  }, [card, found, router]);

  const complete = found.size === card.length && card.length > 0;
  const pct = Math.round((found.size / card.length) * 100);

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .scav-prompt {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--color-text-on-dark);
          text-align: center;
          margin-bottom: 14px;
          line-height: 1.4;
        }
        .scav-prompt .scav-move { color: var(--wv-mint); }
        .scav-lq-hint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--color-text-on-dark);
          opacity: 0.9; text-align: center; margin: -8px 0 16px; line-height: 1.4;
        }
        .scav-lq { position: absolute; top: 8px; left: 8px; font-size: 15px; line-height: 1; }
        .scav-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        button.scav-item:not([type="submit"]):not(.wv-header-signout) {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-height: 130px;
          padding: 16px 10px;
          background: var(--wv-white);
          border: 2.5px solid rgba(39, 50, 72, 0.1);
          border-radius: 22px 26px 20px 24px;
          cursor: pointer;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.1);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 150ms ease;
        }
        button.scav-item:not([type="submit"]):not(.wv-header-signout):active { scale: 0.95; }
        button.scav-item:not([type="submit"]):not(.wv-header-signout):focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        button.scav-item[data-found="true"]:not([type="submit"]):not(.wv-header-signout) {
          border-color: var(--wv-teal);
          background: color-mix(in srgb, var(--wv-teal) 14%, var(--wv-white));
        }
        .scav-item-icon { transition: opacity 150ms ease; }
        button.scav-item[data-found="true"] .scav-item-icon { opacity: 0.4; }
        .scav-item-emoji { font-size: 48px; line-height: 1; }
        .scav-item-name {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: #4b5563; text-align: center; line-height: 1.2;
        }
        .scav-check {
          position: absolute; top: 8px; right: 8px;
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; color: var(--wv-white);
          background: var(--wv-teal);
          animation: scavPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scavPop { from { scale: 0; } 60% { scale: 1.3; } to { scale: 1; } }
        .scav-progress-wrap { margin-bottom: 16px; }
        .scav-progress-label {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 15px; color: var(--color-text-on-dark);
          text-align: center; margin-bottom: 6px;
        }
        .scav-progress-track { height: 14px; border-radius: 8px; background: rgba(255,255,255,0.25); overflow: hidden; }
        .scav-progress-fill { height: 100%; background: var(--wv-mint); border-radius: 8px; transition: width 250ms ease; }
        .scav-celebrate {
          text-align: center;
          font-family: var(--font-fraunces), serif;
          font-weight: 600; font-size: 22px; color: var(--wv-mint);
          margin-bottom: 14px;
          animation: scavPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .scav-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        button.scav-reroll:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-cadet);
          background: var(--wv-white); border: none; border-radius: 14px; padding: 10px 16px; cursor: pointer;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.12);
        }
        button.scav-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 17px; color: var(--wv-white);
          background: var(--wv-redwood); border: none;
          border-radius: 18px 22px 16px 20px; padding: 13px 26px; cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.18);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.scav-done[data-complete="true"]:not([type="submit"]):not(.wv-header-signout) { animation: scavNudge 1.1s ease-in-out infinite; }
        @keyframes scavNudge { 0%,100% { scale: 1; } 50% { scale: 1.05; } }
        button.scav-reroll:focus-visible, button.scav-done:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .scav-check, .scav-celebrate { animation: none; }
          button.scav-done[data-complete="true"]:not([type="submit"]):not(.wv-header-signout) { animation: none; }
          button.scav-item:not([type="submit"]):not(.wv-header-signout):active { scale: 1; }
        }
      `}</style>

      <p className="scav-prompt">
        find all {card.length} — by{" "}
        <span className="scav-move">
          {move.emoji} {move.word}!
        </span>
      </p>
      <p className="scav-lq-hint">as you go: which ones are 🔊 LOUD? which are 🔇 QUIET?</p>

      <div className="scav-grid">
        {card.map((mat) => {
          const isFound = found.has(mat.title);
          const char = mat.preferIcon ? null : resolveCharacterFromForm(mat.formPrimary, mat.title);
          return (
            <button
              key={mat.id}
              type="button"
              className="scav-item"
              data-found={isFound}
              onClick={() => toggle(mat.title)}
              aria-pressed={isFound}
              aria-label={isFound ? `found ${mat.title}` : `find ${mat.title}`}
            >
              {isFound && <span className="scav-check" aria-hidden="true">✓</span>}
              {mat.loudQuiet && (
                <span className="scav-lq" aria-hidden="true">
                  {mat.loudQuiet === "loud" ? "🔊" : "🔇"}
                </span>
              )}
              <span className="scav-item-icon" aria-hidden="true">
                {char ? (
                  <CharacterSlot character={char} size={56} animate={false} variant={variant} />
                ) : mat.icon ? (
                  <img
                    src={`${ICON_BASE}/icons/materials/${mat.icon}.png`}
                    alt=""
                    width={52}
                    height={52}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <span className="scav-item-emoji">{mat.emoji ?? "🧱"}</span>
                )}
              </span>
              <span className="scav-item-name">{mat.title}</span>
            </button>
          );
        })}
      </div>

      <div className="scav-progress-wrap">
        <p className="scav-progress-label" aria-live="polite">
          {found.size} of {card.length} found!
        </p>
        <div className="scav-progress-track">
          <div className="scav-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {complete && <p className="scav-celebrate">🎉 you found them all! 🎉</p>}

      <div className="scav-foot">
        <button type="button" className="scav-reroll" onClick={reroll}>
          🔄 new hunt
        </button>
        <button type="button" className="scav-done" data-complete={complete} onClick={done}>
          done — let&rsquo;s make! →
        </button>
      </div>
    </div>
  );
}
