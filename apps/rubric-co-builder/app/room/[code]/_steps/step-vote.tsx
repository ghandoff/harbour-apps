"use client";

import { useMemo } from "react";
import type { Criterion, Vote } from "@/lib/types";
import { apiPath } from "@/lib/paths";

// must match the server: 2 crit → 1 dot, 3 → 2, 4+ → 3.
function maxVotesFor(criteriaOnBallot: number): number {
  if (criteriaOnBallot <= 1) return 1;
  return Math.min(3, Math.max(1, criteriaOnBallot - 1));
}

type Props = {
  code: string;
  criteria: Criterion[];
  votes: Vote[];
  participantId: string | null;
  participantsCount: number;
};

export function StepVote({
  code,
  criteria,
  votes,
  participantId,
  participantsCount,
}: Props) {
  const maxVotes = maxVotesFor(criteria.length);

  const myVotes = useMemo(
    () => (participantId ? votes.filter((v) => v.participant_id === participantId) : []),
    [votes, participantId],
  );
  const myCast = new Set(myVotes.map((v) => v.criterion_id));
  const dotsLeft = Math.max(0, maxVotes - myVotes.length);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of votes) m.set(v.criterion_id, (m.get(v.criterion_id) ?? 0) + 1);
    return m;
  }, [votes]);

  const totalPossible = Math.max(1, participantsCount * maxVotes);
  const threshold = Math.max(1, Math.ceil(totalPossible * 0.3));

  async function toggle(criterion: Criterion) {
    if (!participantId) return;
    const already = myCast.has(criterion.id);
    if (already) {
      await fetch(
        apiPath(
          `/api/rooms/${code}/votes?participant_id=${participantId}&criterion_id=${criterion.id}`,
        ),
        { method: "DELETE" },
      );
    } else {
      if (dotsLeft <= 0) return;
      await fetch(apiPath(`/api/rooms/${code}/votes`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          criterion_id: criterion.id,
        }),
      });
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold">
          which {maxVotes === 1 ? "one" : maxVotes === 2 ? "two" : "three"} matter{maxVotes === 1 ? "s" : ""} most?
        </h1>
        <p className="text-[color:var(--color-cadet)]/85 leading-relaxed">
          you have <strong>{maxVotes} dot{maxVotes === 1 ? "" : "s"}</strong>. drop{" "}
          {maxVotes === 1 ? "it" : "them"} on the criteria that should end up on the
          rubric. tap a card to add a dot, tap again to take it back. required
          criteria are locked in regardless of the vote.
        </p>
        {participantId ? (
          <p className="text-sm">
            <span className="font-semibold text-[color:var(--color-sienna)]">
              {dotsLeft}
            </span>{" "}
            dot{dotsLeft === 1 ? "" : "s"} left.
          </p>
        ) : (
          <p className="text-sm text-[color:var(--color-cadet)]/60">
            you&apos;re watching — voting is off on the host view.
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {criteria.map((c) => {
          const count = counts.get(c.id) ?? 0;
          const mine = myCast.has(c.id);
          const survives = c.required || count >= threshold;
          return (
            <button
              key={c.id}
              disabled={!participantId || (dotsLeft <= 0 && !mine)}
              onClick={() => toggle(c)}
              aria-pressed={mine}
              className={[
                "group relative text-left rounded-lg bg-white p-4 transition-all",
                mine
                  ? "ring-2 ring-[color:var(--color-sienna)] shadow-sm"
                  : "border border-[color:var(--color-cadet)]/15 hover:border-[color:var(--color-cadet)]/40",
                survives ? "bg-gradient-to-br from-white to-[color:var(--color-champagne)]/60" : "",
                !participantId ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[color:var(--color-cadet)]">
                  {c.name}
                </p>
                {c.required ? (
                  <span className="text-[10px] uppercase tracking-wider bg-[color:var(--color-cadet)] text-white rounded px-2 py-0.5">
                    required
                  </span>
                ) : null}
              </div>
              {c.good_description ? (
                <p className="text-xs text-[color:var(--color-cadet)]/70 mt-1 leading-relaxed">
                  {c.good_description}
                </p>
              ) : null}

              <div className="flex items-center gap-1 mt-4 flex-wrap">
                {Array.from({ length: count }).map((_, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full bg-[color:var(--color-sienna)]"
                    aria-hidden
                  />
                ))}
                {count === 0 ? (
                  <span className="text-[10px] text-[color:var(--color-cadet)]/40">
                    no dots yet
                  </span>
                ) : null}
              </div>

              {survives ? (
                <p className="text-[10px] uppercase tracking-wider mt-2 text-[color:var(--color-cadet)] font-semibold">
                  making the cut
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[color:var(--color-cadet)]/55 max-w-xl">
        when the host taps <em>tally</em>, any criterion past <strong>{threshold}</strong>{" "}
        dot{threshold === 1 ? "" : "s"} (30% of the room&apos;s max) or marked required
        moves to the scale step. top five, whichever come first.
      </p>
    </div>
  );
}
