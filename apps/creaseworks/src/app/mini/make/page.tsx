"use client";

/**
 * mini make — stage stub.
 *
 * Slice 5 wires this to the matcher: materials collected in look are
 * scored against the five pilot activities' material lists, the best
 * match renders its picture+audio guide, and character-from-a-crease
 * catches everything else ("whatever you collect is right").
 */

import Link from "next/link";
import { MiniStageHero } from "../stage-hero";

export default function MiniMakePage() {
  return (
    <div>
      <MiniStageHero stage="make" />
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
        the make stage is being built — it will match what you found to
        one of five activities. for now, head back to{" "}
        <Link href="/mini/look" style={{ textDecoration: "underline" }}>
          look
        </Link>{" "}
        and keep hunting!
      </p>
    </div>
  );
}
