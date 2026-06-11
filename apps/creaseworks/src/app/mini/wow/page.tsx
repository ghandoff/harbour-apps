"use client";

/**
 * mini wow — stage stub.
 *
 * Slice 7 wires the curated wall here: approved submissions from pilot
 * families appear in a simple gallery (suggestion box → review →
 * display; nothing goes live unmoderated).
 */

import { MiniStageHero } from "../stage-hero";

export default function MiniWowPage() {
  return (
    <div>
      <MiniStageHero stage="wow" />
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
        the wow wall is being built — creations from other families will
        appear here once they&rsquo;ve been reviewed. yours could be first!
      </p>
    </div>
  );
}
