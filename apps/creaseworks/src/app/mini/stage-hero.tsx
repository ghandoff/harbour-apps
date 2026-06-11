"use client";

/**
 * MiniStageHero — shared header for the four stage pages: the stage's
 * character (large, animated), its kid-language blurb, and a quiet
 * adult framing line underneath.
 */

import CharacterSlot from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { getMiniStage, type MiniStageKey } from "@/lib/mini-pilot";

export function MiniStageHero({ stage }: { stage: MiniStageKey }) {
  const variant = useCharacterVariant();
  const s = getMiniStage(stage);

  return (
    <header className="mini-stage-hero">
      <style>{`
        .mini-stage-hero {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 10px 0 24px;
        }
        .mini-stage-hero h1 {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 26px;
          color: var(--wv-cadet);
          margin-bottom: 2px;
        }
        .mini-stage-kid {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--wv-cadet);
          opacity: 0.8;
          line-height: 1.4;
        }
        .mini-stage-adult {
          font-size: 12px;
          color: var(--wv-cadet);
          opacity: 0.45;
          margin-top: 4px;
          line-height: 1.5;
        }
      `}</style>
      <CharacterSlot
        character={s.character}
        size={64}
        animate={true}
        variant={variant}
      />
      <div>
        <h1>{s.label}</h1>
        <p className="mini-stage-kid">{s.kidBlurb}</p>
        <p className="mini-stage-adult">{s.adultBlurb}</p>
      </div>
    </header>
  );
}
