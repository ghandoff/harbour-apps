"use client";

import { Wordmark } from "@/app/_components/wordmark";
import type { RoomState } from "@/lib/types";

const STATE_LABELS: Record<RoomState, string> = {
  lobby: "0.5 arrivals",
  frame: "1 frame",
  propose: "2 propose",
  vote: "3 vote",
  scale: "4 scale",
  calibrate: "5 calibrate",
  ai_ladder: "5.5a AI ladder",
  pledge: "5.5b pledge",
  commit: "6 commit",
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
          {role} view · step {STATE_LABELS[state]}
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
