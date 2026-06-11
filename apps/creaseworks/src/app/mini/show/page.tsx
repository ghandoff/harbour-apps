"use client";

/**
 * mini show — stage stub.
 *
 * Slice 6 wires photo + reflection capture here, attached to the
 * session's access code (no accounts for pilot families). Reuses the
 * evidence upload pipeline fixed in #173.
 */

import { MiniStageHero } from "../stage-hero";

export default function MiniShowPage() {
  return (
    <div>
      <MiniStageHero stage="show" />
      <p
        style={{
          fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          color: "var(--wv-cadet)",
          opacity: 0.6,
          lineHeight: 1.6,
        }}
      >
        the show stage is being built — snap a photo of what you made and
        tell us about it. coming very soon!
      </p>
    </div>
  );
}
