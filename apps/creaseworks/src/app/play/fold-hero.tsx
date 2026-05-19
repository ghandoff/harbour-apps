"use client";

/**
 * FoldHero — play page header with Mud character.
 *
 * Client island: needs useCharacterVariant() to read the kid/adult
 * register from the ambient CharacterVariantProvider wired in layout.tsx.
 * Mud is the character for the fold phase — malleable, reshaping insight
 * into form.
 */

import CharacterSlot from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";

export function FoldHero() {
  const variant = useCharacterVariant();
  return (
    <header className="mb-10 flex items-center gap-5">
      <CharacterSlot character="mud" size={64} animate={true} variant={variant} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-serif mb-2">
          fold
        </h1>
        <p className="text-cadet/60 max-w-lg text-sm">
          shape insight into experiment — explore collections and playdates
          to find your next creative moment.
        </p>
      </div>
    </header>
  );
}
