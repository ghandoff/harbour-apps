import { describe, expect, it } from "vitest";
import {
  MINI_ACTIVITIES,
  MINI_FALLBACK_SLUG,
  matchActivities,
  miniStageFromPathname,
} from "./mini-pilot";
import { MINI_MATERIALS } from "./mini-data";

describe("mini pilot config", () => {
  it("every suggested material exists in the committed snapshot", () => {
    const known = new Set(MINI_MATERIALS.map((m) => m.title));
    for (const activity of MINI_ACTIVITIES) {
      for (const title of activity.materials) {
        expect(known, `${activity.slug} → ${title}`).toContain(title);
      }
    }
  });

  it("the fallback slug is one of the five activities", () => {
    expect(MINI_ACTIVITIES.map((a) => a.slug)).toContain(MINI_FALLBACK_SLUG);
  });
});

describe("matchActivities", () => {
  it("ranks the activity whose materials were found first", () => {
    const mend = MINI_ACTIVITIES.find((a) => a.slug === "mend-a-stuffed-friend")!;
    const ranked = matchActivities(mend.materials.slice(0, 4));
    expect(ranked[0].activity.slug).toBe("mend-a-stuffed-friend");
    expect(ranked[0].matched).toHaveLength(4);
    expect(ranked[0].isFallback).toBe(false);
  });

  it("computes score as matched over suggested", () => {
    const swap = MINI_ACTIVITIES.find((a) => a.slug === "function-swap-same-form")!;
    const ranked = matchActivities(swap.materials); // all 8 of 8
    expect(ranked[0].score).toBe(1);
  });

  it("falls back to character-from-a-crease when nothing matches", () => {
    const ranked = matchActivities(["a sock full of mystery"]);
    expect(ranked[0].activity.slug).toBe(MINI_FALLBACK_SLUG);
    expect(ranked[0].isFallback).toBe(true);
  });

  it("falls back on a single weak match (below MIN_MATCHES)", () => {
    const ranked = matchActivities(["dice"]); // 1 match for design-a-rule
    expect(ranked[0].activity.slug).toBe(MINI_FALLBACK_SLUG);
    expect(ranked[0].isFallback).toBe(true);
  });

  it("empty haul still returns a full ranking with the fallback first", () => {
    const ranked = matchActivities([]);
    expect(ranked).toHaveLength(MINI_ACTIVITIES.length);
    expect(ranked[0].activity.slug).toBe(MINI_FALLBACK_SLUG);
  });
});

describe("miniStageFromPathname", () => {
  it("reads the stage in both flavours", () => {
    expect(miniStageFromPathname("/mini/look")).toBe("look");
    expect(miniStageFromPathname("/look")).toBe("look");
    expect(miniStageFromPathname("/mini")).toBeNull();
    expect(miniStageFromPathname("/")).toBeNull();
  });
});
