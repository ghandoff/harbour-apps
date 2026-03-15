"use client";

import { BloomsBadge } from "./blooms-badge";
import type { LearningObjective } from "@/lib/types";

interface ObjectiveCardProps {
  objective: LearningObjective;
  on_generate?: (objective: LearningObjective) => void;
  is_generating?: boolean;
}

export function ObjectiveCard({ objective, on_generate, is_generating }: ObjectiveCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--color-text-on-dark)] leading-relaxed flex-1">
          {objective.raw_text}
        </p>
        <BloomsBadge level={objective.blooms_level} size="md" />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-on-dark-muted)]">
        <span>
          verb: <strong className="text-[var(--color-text-on-dark)]">{objective.cognitive_verb}</strong>
        </span>
        <span className="opacity-30">|</span>
        <span>
          knowledge: <strong className="text-[var(--color-text-on-dark)]">{objective.knowledge_dimension}</strong>
        </span>
        <span className="opacity-30">|</span>
        <span>
          topic: <strong className="text-[var(--color-text-on-dark)]">{objective.content_topic}</strong>
        </span>
        {objective.confidence < 0.8 && (
          <>
            <span className="opacity-30">|</span>
            <span className="text-[var(--dc-bloom-evaluate)]">
              low confidence ({(objective.confidence * 100).toFixed(0)}%)
            </span>
          </>
        )}
      </div>

      {on_generate && (
        <button
          onClick={() => on_generate(objective)}
          disabled={is_generating}
          className="text-xs font-medium text-[var(--wv-champagne)] hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {is_generating ? "generating..." : "generate assessment task →"}
        </button>
      )}
    </div>
  );
}
