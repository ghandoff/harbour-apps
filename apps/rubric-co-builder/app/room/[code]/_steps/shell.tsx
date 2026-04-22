"use client";

import { Wordmark } from "@/app/_components/wordmark";
import type { RoomState } from "@/lib/types";

const STATE_LABELS: Record<RoomState, string> = {
  lobby: "0.5 arrivals",
  frame: "1 frame",
  propose: "2 propose",
  vote: "3 vote — round 1",
  criteria_gate: "3.5 facilitator review",
  scale: "4 scale",
  vote2: "5 vote — round 2",
  vote3: "6 vote — round 3",
  calibrate: "6 calibrate",   // legacy
  ai_ladder: "7 AI ladder",
  pledge: "8 pledge",
  commit: "9 commit",
};

export function StepShell({
  children,
  state,
  surface = "white",
  participantsCount,
  role,
}: {
  children: React.ReactNode;
  state: RoomState;
  surface?: "white" | "champagne";
  participantsCount?: number;
  role: "host" | "student";
}) {
  const bg = surface === "champagne" ? "surface-champagne" : "";
  return (
    <main className={`min-h-screen w-full px-6 py-10 ${bg}`}>
      <Wordmark />
      <header className="max-w-6xl mx-auto mb-8 flex items-center justify-between gap-4">
        <p className="text-xs tracking-widest text-[color:var(--color-cadet)]/70">
          {role} view · step {STATE_LABELS[state] ?? state}
        </p>
        {typeof participantsCount === "number" ? (
          <p className="text-xs text-[color:var(--color-cadet)]/70">
            {participantsCount} joined
          </p>
        ) : null}
      </header>
      <div className="max-w-6xl mx-auto">{children}</div>
    </main>
  );
}
