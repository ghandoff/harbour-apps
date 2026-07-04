"use client";

/**
 * mini look — classic mode ("tap what you have").
 *
 * The proven picker: kids walk around, grab things, and tap the
 * matching tiles. The shared FoundPicker handles the grid, selection,
 * and the hand-off to make.
 */

import { useEffect, useState } from "react";
import { loadContext, type MiniContext } from "@/lib/mini-pilot";
import { MiniStageHero } from "../../stage-hero";
import { FoundPicker } from "../found-picker";

// same loud/quiet + affordance framing everywhere — only the WHERE swaps.
const TAIL = "find one LOUD thing and one QUIET thing (and anything else that can DO something!)";
const WHERE: Record<MiniContext, string> = {
  indoor: "walk around inside",
  outdoor: "head outside",
};
const NEUTRAL = "walk around";

export default function MiniClassicLookPage() {
  // SSR-safe context read: null on the server and first client paint (neutral
  // prompt), then swaps to the place-aware where once mounted.
  const [context, setContext] = useState<MiniContext | null>(null);
  useEffect(() => {
    setContext(loadContext());
  }, []);

  const where = context ? WHERE[context] : NEUTRAL;

  return (
    <div>
      <MiniStageHero stage="look" />
      <FoundPicker tool="classic" prompt={`${where} — ${TAIL}`} />
    </div>
  );
}
