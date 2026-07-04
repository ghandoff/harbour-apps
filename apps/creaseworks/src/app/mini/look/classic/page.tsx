"use client";

/**
 * mini look — classic mode ("tap what you have").
 *
 * The proven picker: kids walk around, grab things, and tap the
 * matching tiles. The shared FoundPicker handles the grid, selection,
 * and the hand-off to make.
 */

import { MiniStageHero } from "../../stage-hero";
import { FoundPicker } from "../found-picker";

// same loud/quiet + affordance framing everywhere.
const TAIL = "find one LOUD thing and one QUIET thing (and anything else that can DO something!)";

export default function MiniClassicLookPage() {
  return (
    <div>
      <MiniStageHero stage="look" />
      <FoundPicker tool="classic" prompt={`walk around — ${TAIL}`} />
    </div>
  );
}
