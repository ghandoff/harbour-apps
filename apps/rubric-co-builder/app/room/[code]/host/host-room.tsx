"use client";

import { useEffect, useRef, useState } from "react";
import { useRoom } from "@/lib/use-room";
import { Wordmark } from "@/app/_components/wordmark";
import { apiPath } from "@/lib/paths";
import type {
  AiUseVote,
  CalibrationScore,
  Criterion,
  PledgeSlot,
  Room,
  RoomState,
  Scale,
  Vote,
} from "@/lib/types";
import { StepShell } from "../_steps/shell";
import { StepFrame } from "../_steps/step-frame";
import { StepPropose } from "../_steps/step-propose";
import { StepVote } from "../_steps/step-vote";
import { StepScale } from "../_steps/step-scale";
import { StepCalibrate } from "../_steps/step-calibrate";
import { StepAiLadder } from "../_steps/step-ai-ladder";
import { StepPledge } from "../_steps/step-pledge";
import { StepCommit } from "../_steps/step-commit";
import { JoinQR } from "@/app/_components/join-qr";
import { FacilitatorNudgeEditor } from "@/app/_components/nudge";

const STATE_ORDER: RoomState[] = [
  "lobby",
  "frame",
  "propose",
  "vote",
  "scale",
  "calibrate",
  "ai_ladder",
  "pledge",
  "commit",
];

export function HostRoom({ code }: { code: string }) {
  const state = useRoom(code);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Wordmark />
        <p className="text-[color:var(--color-cadet)]/70">spinning up the room…</p>
      </main>
    );
  }

  if (state.status === "error" && !state.snapshot) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <Wordmark />
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-3">something wobbled.</h1>
          <p className="text-[color:var(--color-cadet)]/80">{state.error}</p>
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
    calibration_scores,
    ai_use_votes,
    pledge_slots,
  } = snapshot;

  async function advance(to: RoomState) {
    await fetch(apiPath(`/api/rooms/${code}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: to }),
    });
  }

  async function tally() {
    await fetch(apiPath(`/api/rooms/${code}/tally`), { method: "POST" });
  }

  async function aiTally() {
    await fetch(apiPath(`/api/rooms/${code}/ai-tally`), { method: "POST" });
  }

  const surface: "white" | "champagne" =
    room.state === "lobby" || room.state === "frame" || room.state === "commit"
      ? "champagne"
      : "white";

  return (
    <StepShell
      state={room.state}
      role="host"
      participantsCount={participants_count}
      surface={surface}
    >
      <div className="space-y-8">
        <HostControls
          code={code}
          current={room.state}
          onAdvance={advance}
          onTally={tally}
          onAiTally={aiTally}
        />

        <FacilitatorNudgeEditor code={code} currentNudge={room.facilitator_nudge} />

        <div className="pointer-events-none opacity-95">
          <HostBody
            code={code}
            room={room}
            criteria={criteria}
            votes={votes}
            scales={scales}
            calibration_scores={calibration_scores}
            ai_use_votes={ai_use_votes}
            pledge_slots={pledge_slots}
            participants_count={participants_count}
          />
        </div>
      </div>
    </StepShell>
  );
}

function HostControls({
  code,
  current,
  onAdvance,
  onTally,
  onAiTally,
}: {
  code: string;
  current: RoomState;
  onAdvance: (s: RoomState) => void;
  onTally: () => Promise<void>;
  onAiTally: () => Promise<void>;
}) {
  const [pending, setPending] = useState<string | null>(null);
  // clear pending when the server-reported state matches the action's target.
  // the parent re-renders on poll; this effect notices the transition.
  const lastCurrent = useRef(current);
  useEffect(() => {
    if (lastCurrent.current !== current) {
      setPending(null);
      lastCurrent.current = current;
    }
  }, [current]);

  const next = (() => {
    const i = STATE_ORDER.indexOf(current);
    return i < STATE_ORDER.length - 1 ? STATE_ORDER[i + 1] : null;
  })();

  async function wrap(action: () => Promise<void>, label: string) {
    setPending(label);
    try {
      await action();
    } finally {
      // keep it pending for a moment; the effect clears on state change.
      // if the state doesn't change within 3s, give up and re-enable.
      setTimeout(() => setPending((p) => (p === label ? null : p)), 3000);
    }
  }

  return (
    <div className="rounded-lg bg-[color:var(--color-cadet)] text-white p-4 pointer-events-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-widest opacity-70">room code</p>
          <p className="text-2xl font-bold tracking-[0.3em]">{code}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {current === "vote" ? (
            <button
              onClick={() => wrap(onTally, "tally")}
              disabled={pending !== null}
              className="bg-[color:var(--color-sienna)] text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
            >
              {pending === "tally" ? "tallying…" : "tally & move to scale"}
            </button>
          ) : current === "ai_ladder" ? (
            <button
              onClick={() => wrap(onAiTally, "ai-tally")}
              disabled={pending !== null}
              className="bg-[color:var(--color-sienna)] text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
            >
              {pending === "ai-tally" ? "locking ceiling…" : "lock ceiling & move to pledge"}
            </button>
          ) : next ? (
            <button
              onClick={async () => {
                setPending("advance");
                onAdvance(next);
                setTimeout(() => setPending((p) => (p === "advance" ? null : p)), 3000);
              }}
              disabled={pending !== null}
              className="bg-white text-[color:var(--color-cadet)] px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
            >
              {pending === "advance" ? "moving…" : `move to ${next.replace("_", " ")} →`}
            </button>
          ) : null}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            {STATE_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => onAdvance(s)}
                className={`px-2 py-1 rounded ${
                  s === current
                    ? "bg-white text-[color:var(--color-cadet)]"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type HostBodyProps = {
  code: string;
  room: Room;
  criteria: Criterion[];
  votes: Vote[];
  scales: Scale[];
  calibration_scores: CalibrationScore[];
  ai_use_votes: AiUseVote[];
  pledge_slots: PledgeSlot[];
  participants_count: number;
};

function HostBody({
  code,
  room,
  criteria,
  votes,
  scales,
  calibration_scores,
  ai_use_votes,
  pledge_slots,
  participants_count,
}: HostBodyProps) {
  switch (room.state) {
    case "lobby":
      return (
        <div className="flex flex-col items-center text-center gap-5 py-10">
          <h2 className="text-2xl font-bold">share the join link.</h2>
          <p className="text-[color:var(--color-cadet)]/80 max-w-md">
            students scan the code below, or visit{" "}
            <span className="font-mono text-sm">/room/{room.code}/join</span> directly.
          </p>
          <JoinQR code={room.code} size={200} />
          <p className="text-sm text-[color:var(--color-cadet)]/70">
            {participants_count} in the room so far.
          </p>
        </div>
      );
    case "frame":
      return <StepFrame room={room} />;
    case "propose":
      return <StepPropose code={code} criteria={criteria} canEdit={false} />;
    case "vote":
      return (
        <StepVote
          code={code}
          criteria={criteria.filter((c) => c.status !== "rejected")}
          votes={votes}
          participantId={null}
          participantsCount={participants_count}
        />
      );
    case "scale":
      return <StepScale code={code} criteria={criteria} scales={scales} canEdit={false} />;
    case "calibrate":
      return (
        <StepCalibrate
          code={code}
          room={room}
          criteria={criteria}
          scales={scales}
          scores={calibration_scores}
          participantId={null}
        />
      );
    case "ai_ladder":
      return (
        <StepAiLadder
          code={code}
          votes={ai_use_votes}
          participantId={null}
          participantsCount={participants_count}
        />
      );
    case "pledge":
      return (
        <StepPledge
          code={code}
          slots={pledge_slots}
          votes={ai_use_votes}
          canEdit={false}
        />
      );
    case "commit":
      return (
        <StepCommit
          room={room}
          criteria={criteria}
          scales={scales}
          votes={ai_use_votes}
          slots={pledge_slots}
        />
      );
  }
}
