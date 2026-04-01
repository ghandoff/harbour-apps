"use client";

import { useState } from "react";
import type { PredictionConfig, Participant } from "@/lib/types";

interface Props {
  config: PredictionConfig;
  role: "facilitator" | "participant";
  onSubmit?: (response: unknown) => void;
  responses?: Record<string, unknown>;
  participants?: Record<string, Participant>;
  submitted?: boolean;
}

export function PredictionActivity({
  config,
  role,
  onSubmit,
  responses,
  participants,
  submitted,
}: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const parsed = config.type === "number" ? Number(value) : value.trim();
    onSubmit?.(parsed);
  };

  // compute stats for number predictions
  const numericResponses = responses
    ? Object.values(responses).filter((r): r is number => typeof r === "number")
    : [];
  const avg =
    numericResponses.length > 0
      ? numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length
      : null;
  const median =
    numericResponses.length > 0
      ? numericResponses.sort((a, b) => a - b)[Math.floor(numericResponses.length / 2)]
      : null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{config.question}</h3>

      {role === "participant" && !submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2 items-center">
            <input
              type={config.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.type === "number" ? "your estimate" : "your prediction"}
              className="flex-1 px-4 py-3 rounded-xl border border-black/10 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-[var(--rh-cyan)] focus:border-transparent"
              autoFocus
            />
            {config.unit && (
              <span className="text-lg text-[var(--rh-text-muted)] font-medium">
                {config.unit}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[var(--rh-cyan)] text-white font-semibold hover:bg-[var(--rh-teal)] transition-colors"
          >
            lock in my prediction
          </button>
        </form>
      ) : role === "participant" && submitted ? (
        <div className="text-center py-6 text-[var(--rh-text-muted)]">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-sm">prediction locked — waiting for reveal</p>
        </div>
      ) : (
        /* facilitator view */
        <div className="space-y-4">
          {responses ? (
            <>
              {/* the reveal */}
              {config.answer !== undefined && (
                <div className="p-4 rounded-xl bg-[var(--rh-teal)] text-white text-center">
                  <p className="text-xs uppercase tracking-wider opacity-70 mb-1">
                    the answer
                  </p>
                  <p className="text-3xl font-bold">
                    {config.unit && config.type === "number" ? config.unit : ""}
                    {config.answer}
                  </p>
                </div>
              )}

              {/* prediction distribution */}
              {config.type === "number" && numericResponses.length > 0 && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-black/5">
                    <p className="text-xs text-[var(--rh-text-muted)]">average</p>
                    <p className="text-lg font-semibold">
                      {avg?.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/5">
                    <p className="text-xs text-[var(--rh-text-muted)]">median</p>
                    <p className="text-lg font-semibold">{median}</p>
                  </div>
                </div>
              )}

              {/* individual responses */}
              <div className="space-y-1.5">
                {Object.entries(responses).map(([pid, response]) => (
                  <div
                    key={pid}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 text-sm"
                  >
                    <span className="text-[var(--rh-text-muted)] flex-1 truncate">
                      {participants?.[pid]?.displayName || pid.slice(0, 6)}
                    </span>
                    <span className="font-medium">
                      {config.unit}
                      {String(response)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--rh-text-muted)]">
              predictions are hidden — click &quot;reveal results&quot; to show
              the answer and all predictions
            </p>
          )}
        </div>
      )}
    </div>
  );
}
