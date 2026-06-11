"use client";

/**
 * MiniStageHero — vibrant stage band: the stage's character (big,
 * animated) on its tint, with the kid blurb. Nothing else — adult
 * guidance lives in the grown-up corner, not on the kid surface.
 */

import CharacterSlot from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { getMiniStage, type MiniStageKey } from "@/lib/mini-pilot";

export function MiniStageHero({ stage }: { stage: MiniStageKey }) {
  const variant = useCharacterVariant();
  const s = getMiniStage(stage);

  return (
    <header
      className="mini-stage-hero"
      style={{ ["--tint" as string]: s.tint, ["--accent" as string]: s.accent }}
    >
      <style>{`
        .mini-stage-hero {
          display: flex;
          align-items: center;
          gap: 18px;
          background: var(--tint);
          border-radius: 24px 30px 22px 28px;
          padding: 18px 20px;
          margin: 6px 0 22px;
        }
        .mini-stage-hero h1 {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 32px;
          color: var(--wv-cadet);
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .mini-stage-kid {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: var(--wv-cadet);
          line-height: 1.35;
        }
      `}</style>
      <CharacterSlot
        character={s.character}
        size={96}
        animate={true}
        variant={variant}
      />
      <div>
        <h1>{s.label}</h1>
        <p className="mini-stage-kid">{s.kidBlurb}</p>
      </div>
    </header>
  );
}
