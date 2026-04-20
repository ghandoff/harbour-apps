"use client";

import { useMemo } from "react";
import type { AiUseLevel, AiUseVote } from "@/lib/types";
import { AI_USE_LEVELS } from "@/lib/types";
import { apiPath } from "@/lib/paths";

type Props = {
  code: string;
  votes: AiUseVote[];
  participantId: string | null;
  participantsCount: number;
};

export function StepAiLadder({ code, votes, participantId, participantsCount }: Props) {
  const counts = useMemo(() => {
    const m: Record<AiUseLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const v of votes) m[v.level]++;
    return m;
  }, [votes]);

  const myVote = useMemo(
    () =>
      participantId ? votes.find((v) => v.participant_id === participantId) ?? null : null,
    [votes, participantId],
  );

  async function cast(level: AiUseLevel) {
    if (!participantId) return;
    await fetch(apiPath(`/api/rooms/${code}/ai-votes`), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ participant_id: participantId, level }),
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 items-start">
      <aside className="space-y-4 lg:sticky lg:top-4">
        <p className="text-xs tracking-widest text-[color:var(--color-cadet)]/70">
          step 5.5a — AI-use ladder
        </p>
        <h1 className="text-3xl font-bold">how high does AI climb?</h1>
        <p className="text-[color:var(--color-cadet)]/85 leading-relaxed">
          the rubric says what counts as good. this ladder says how the work gets made.
          pick the rung that feels right for this project. one dot each. whichever rung
          gets the most dots becomes the class&apos; ceiling — everything stays at or
          below it.
        </p>
        {participantId ? (
          <p className="text-sm">
            {myVote ? (
              <>
                you voted for{" "}
                <span className="font-semibold text-[color:var(--color-sienna)]">
                  level {myVote.level}
                </span>
                . tap another rung to change.
              </>
            ) : (
              <>tap a rung to cast your dot.</>
            )}
          </p>
        ) : (
          <p className="text-sm text-[color:var(--color-cadet)]/60">
            you&apos;re watching — voting is off on the host view.
          </p>
        )}
        <p className="text-xs text-[color:var(--color-cadet)]/60">
          {votes.length} of {Math.max(participantsCount, 1)}{" "}
          {participantsCount === 1 ? "person has" : "people have"} voted. ties break to
          the lower rung.
        </p>
      </aside>

      <section className="space-y-3 relative">
        <div
          aria-hidden
          className="absolute left-8 top-4 bottom-4 w-[2px] bg-[color:var(--color-cadet)]/20 rounded"
        />
        {[...AI_USE_LEVELS].reverse().map((rung) => {
          const mine = myVote?.level === rung.level;
          const rungCount = counts[rung.level];
          return (
            <button
              key={rung.level}
              disabled={!participantId}
              onClick={() => cast(rung.level)}
              aria-pressed={mine}
              className={[
                "w-full flex items-start gap-4 rounded-lg p-4 text-left transition-all relative z-10",
                "bg-white border border-[color:var(--color-cadet)]/15",
                mine ? "ring-2 ring-[color:var(--color-sienna)]" : "",
                participantId ? "hover:border-[color:var(--color-cadet)]/40 cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              <div className="w-16 shrink-0 flex flex-col items-center">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    mine
                      ? "bg-[color:var(--color-sienna)] text-white"
                      : "bg-[color:var(--color-cadet)] text-white",
                  ].join(" ")}
                >
                  {rung.level}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[color:var(--color-cadet)]">
                  level {rung.level} — {rung.name}
                </p>
                <p className="text-sm text-[color:var(--color-cadet)]/80 mt-1 leading-relaxed">
                  {rung.helper}
                </p>
              </div>
              <div className="w-20 shrink-0 flex flex-wrap items-start justify-end gap-1">
                {Array.from({ length: rungCount }).map((_, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full bg-[color:var(--color-sienna)]"
                    aria-hidden
                  />
                ))}
                {rungCount === 0 ? (
                  <span className="text-[10px] text-[color:var(--color-cadet)]/40">
                    —
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
