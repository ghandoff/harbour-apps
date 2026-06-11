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

export default function MiniClassicLookPage() {
  return (
    <div>
      <MiniStageHero stage="look" />
      <FoundPicker prompt="walk around — tap everything you can find!" />
    </div>
  );
}
