import type { AiUseLevel, AiUseVote } from "./types";
import { AI_USE_LEVELS } from "./types";

// tie-break: favour the lower-numbered rung (more conservative ceiling).
export function computeCeiling(
  votes: AiUseVote[],
): { ceiling: AiUseLevel; counts: Record<AiUseLevel, number>; total: number } {
  const counts: Record<AiUseLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const v of votes) counts[v.level]++;
  let ceiling: AiUseLevel = 0;
  let best = -1;
  for (const lvl of [0, 1, 2, 3, 4] as AiUseLevel[]) {
    if (counts[lvl] > best) {
      best = counts[lvl];
      ceiling = lvl;
    }
  }
  return { ceiling, counts, total: votes.length };
}

export function levelMeta(level: AiUseLevel) {
  return AI_USE_LEVELS.find((l) => l.level === level) ?? AI_USE_LEVELS[0];
}
