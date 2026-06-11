"use client";

/**
 * mini look — "hold it up!" — a directed single-material hunt.
 *
 * Distinct from classic (kid picks freely): here the APP picks the
 * target. One material fills the screen; the grown-up holds the phone
 * up so the kid (and the room) can see it, then the kid runs to find
 * one. "got it!" banks it, "skip" moves on. A focused 10-card round
 * feeds the same matcher as every other look mode.
 *
 * Deck is shuffled client-side after mount (not during render) so the
 * server and first client paint agree — no hydration mismatch.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterSlot, { resolveCharacterFromForm } from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { MINI_MATERIALS, type MiniMaterial } from "@/lib/mini-data";
import { MINI_AT_ROOT, miniHref, saveFound } from "@/lib/mini-pilot";
import { MiniStageHero } from "../../stage-hero";

const ICON_BASE = MINI_AT_ROOT ? "/harbour/creaseworks-mini" : "/harbour/creaseworks";
const ROUND = 10;

export default function MiniHoldUpPage() {
  const router = useRouter();
  const variant = useCharacterVariant();
  const [deck, setDeck] = useState<MiniMaterial[]>(MINI_MATERIALS.slice(0, ROUND));
  const [i, setI] = useState(0);
  const [found, setFound] = useState<string[]>([]);

  useEffect(() => {
    const a = [...MINI_MATERIALS];
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    setDeck(a.slice(0, ROUND));
  }, []);

  const finish = useCallback(
    (titles: string[]) => {
      saveFound(titles);
      router.push(miniHref("/make"));
    },
    [router],
  );

  const advance = useCallback(
    (gotIt: boolean) => {
      const mat = deck[i];
      const next = gotIt ? [...found, mat.title] : found;
      if (gotIt) setFound(next);
      if (i + 1 >= deck.length) finish(next);
      else setI(i + 1);
    },
    [deck, i, found, finish],
  );

  const mat = deck[i];
  if (!mat) return null;
  const char = resolveCharacterFromForm(mat.formPrimary, mat.title);

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .mini-hold-prompt {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--color-text-on-dark);
          text-align: center;
          margin-bottom: 14px;
          line-height: 1.4;
        }
        .mini-hold-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          background: var(--wv-white);
          border: 2.5px solid var(--wv-seafoam);
          border-radius: 28px 34px 26px 32px;
          padding: 30px 20px;
          margin-bottom: 18px;
        }
        .mini-hold-emoji { font-size: 110px; line-height: 1; }
        .mini-hold-name {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 26px;
          color: var(--wv-cadet);
          text-align: center;
          line-height: 1.15;
        }
        .mini-hold-actions { display: flex; gap: 12px; margin-bottom: 14px; }
        button.mini-hold-skip:not([type="submit"]):not(.wv-header-signout),
        button.mini-hold-got:not([type="submit"]):not(.wv-header-signout) {
          flex: 1;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 20px;
          border: none;
          border-radius: 20px 26px 18px 24px;
          padding: 18px 0;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.18);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-hold-skip:not([type="submit"]):not(.wv-header-signout) {
          background: var(--wv-white);
          color: var(--wv-cadet);
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.12);
        }
        button.mini-hold-got:not([type="submit"]):not(.wv-header-signout) {
          background: var(--wv-teal);
          color: var(--wv-white);
        }
        button.mini-hold-skip:not([type="submit"]):not(.wv-header-signout):active,
        button.mini-hold-got:not([type="submit"]):not(.wv-header-signout):active { scale: 0.95; }
        button.mini-hold-skip:not([type="submit"]):not(.wv-header-signout):focus-visible,
        button.mini-hold-got:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-hold-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .mini-hold-tally {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border-radius: 12px;
          padding: 6px 12px;
        }
        button.mini-hold-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 16px 20px 14px 18px;
          padding: 10px 20px;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.18);
        }
        button.mini-hold-done:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          button.mini-hold-skip:not([type="submit"]):not(.wv-header-signout):active,
          button.mini-hold-got:not([type="submit"]):not(.wv-header-signout):active { scale: 1; }
        }
      `}</style>

      <p className="mini-hold-prompt">
        hold the phone up so everyone can see — then go find one!
      </p>

      <div className="mini-hold-card" key={mat.id}>
        <span aria-hidden="true">
          {char ? (
            <CharacterSlot character={char} size={120} animate={false} variant={variant} />
          ) : mat.icon ? (
            <img
              src={`${ICON_BASE}/icons/materials/${mat.icon}.png`}
              alt=""
              width={110}
              height={110}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <span className="mini-hold-emoji">{mat.emoji ?? "🧱"}</span>
          )}
        </span>
        <span className="mini-hold-name">{mat.title}</span>
      </div>

      <div className="mini-hold-actions">
        <button type="button" className="mini-hold-skip" onClick={() => advance(false)}>
          skip →
        </button>
        <button type="button" className="mini-hold-got" onClick={() => advance(true)}>
          got it! ✓
        </button>
      </div>

      <div className="mini-hold-foot">
        <span className="mini-hold-tally" aria-live="polite">
          {found.length} found · {i + 1}/{deck.length}
        </span>
        <button type="button" className="mini-hold-done" onClick={() => finish(found)}>
          done — let&rsquo;s make! →
        </button>
      </div>
    </div>
  );
}
