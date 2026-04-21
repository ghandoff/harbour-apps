"use client";

import { useEffect, useState } from "react";
import { useRoom } from "@/lib/use-room";
import { ensureJoined } from "@/lib/participant";
import { StepShell } from "./_steps/shell";
import { StepFrame } from "./_steps/step-frame";
import { StepPropose } from "./_steps/step-propose";
import { StepVote } from "./_steps/step-vote";
import { StepScale } from "./_steps/step-scale";
import { StepCalibrate } from "./_steps/step-calibrate";
import { StepAiLadder } from "./_steps/step-ai-ladder";
import { StepPledge } from "./_steps/step-pledge";
import { StepCommit } from "./_steps/step-commit";
import { GuidingQuestions } from "./_steps/guiding-questions";
import { Wordmark } from "@/app/_components/wordmark";
import { FacilitatorNudgeBanner } from "@/app/_components/nudge";
import { roundForState } from "@/lib/types";
import type { RoomState } from "@/lib/types";

export function StudentRoom({ code }: { code: string }) {
  const state = useRoom(code);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureJoined(code).then((id) => {
      if (!cancelled) setParticipantId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Wordmark />
        <p className="text-[color:var(--color-cadet)]/70">joining room…</p>
      </main>
    );
  }

  if (state.status === "error" && !state.snapshot) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <Wordmark />
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-3">no room at that code.</h1>
          <p className="text-[color:var(--color-cadet)]/80">
            double-check with whoever set it up.
          </p>
        </div>
      </main>
    );
  }

  const snapshot = state.snapshot!;
  const {
    room,
    criteria,
    participants_count,
    votes,
    scales,
    scale_responses,
    calibration_scores,
    ai_use_votes,
    pledge_slots,
  } = snapshot;

  const canEdit = participantId !== null;
  const nudge = <FacilitatorNudgeBanner text={room.facilitator_nudge} />;
  const guide = <GuidingQuestions state={room.state as RoomState} />;

  const body = (() => {
    if (room.state === "lobby") {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 min-h-[50vh]">
          <h1 className="text-3xl sm:text-4xl font-bold">you&apos;re in.</h1>
          <p className="text-[color:var(--color-cadet)]/80 max-w-md">
            the host is still getting the room ready. it&apos;ll move on in a moment.
          </p>
          <p className="text-xs tracking-widest text-[color:var(--color-cadet)]/50 mt-4">
            room · {room.code}
          </p>
        </div>
      );
    }
    if (room.state === "frame") return <StepFrame room={room} />;
    if (room.state === "propose") {
      return <StepPropose code={code} criteria={criteria} canEdit={canEdit} />;
    }
    if (room.state === "vote" || room.state === "vote2" || room.state === "vote3") {
      const ballot = criteria.filter((c) => c.status !== "rejected");
      const round = roundForState(room.state);
      return (
        <StepVote
          code={code}
          criteria={ballot}
          votes={votes}
          participantId={participantId}
          participantsCount={participants_count}
          round={round}
        />
      );
    }
    if (room.state === "scale") {
      return (
        <StepScale
          code={code}
          criteria={criteria}
          scales={scales}
          scaleResponses={scale_responses ?? []}
          participantId={participantId}
          canEdit={canEdit}
        />
      );
    }
    if (room.state === "calibrate") {
      // legacy state: rooms created before the rework land here
      return (
        <StepCalibrate
          code={code}
          room={room}
          criteria={criteria}
          scales={scales}
          scores={calibration_scores}
          participantId={participantId}
        />
      );
    }
    if (room.state === "ai_ladder") {
      return (
        <StepAiLadder
          code={code}
          votes={ai_use_votes}
          participantId={participantId}
          participantsCount={participants_count}
        />
      );
    }
    if (room.state === "pledge") {
      return (
        <StepPledge code={code} slots={pledge_slots} votes={ai_use_votes} canEdit={canEdit} />
      );
    }
    return (
      <StepCommit
        room={room}
        criteria={criteria}
        scales={scales}
        votes={ai_use_votes}
        slots={pledge_slots}
      />
    );
  })();

  const surface =
    room.state === "lobby" ||
    room.state === "frame" ||
    room.state === "commit"
      ? "champagne"
      : undefined;

  return (
    <StepShell
      state={room.state as RoomState}
      role="student"
      participantsCount={participants_count}
      surface={surface}
    >
      {nudge}
      {guide}
      {body}
    </StepShell>
  );
}
