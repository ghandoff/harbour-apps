"use client";

/**
 * mini look — timer mode ("beat the clock").
 *
 * Three phases in one page:
 *   pick   — choose 30 / 60 / 90 seconds (big tappable tiles)
 *   run    — full-screen countdown ring while kids physically scramble
 *            to gather stuff; a gentle chime-free finish (no jump-scares
 *            for little ones), then auto-advance
 *   log    — the shared FoundPicker to tap in what they grabbed
 *
 * The countdown is driven by an interval against a deadline timestamp
 * (not a decrementing counter), so backgrounded tabs stay accurate.
 */

import { useEffect, useRef, useState } from "react";
import { MiniStageHero } from "../../stage-hero";
import { FoundPicker } from "../found-picker";

const DURATIONS = [
  { seconds: 30, label: "quick!", accent: "var(--wv-cornflower)", corners: "22px 28px 18px 26px" },
  { seconds: 60, label: "ready!", accent: "var(--wv-teal)", corners: "26px 20px 28px 22px" },
  { seconds: 90, label: "big hunt!", accent: "var(--wv-seafoam)", corners: "20px 26px 24px 28px" },
] as const;

type Phase = "pick" | "run" | "log";

export default function MiniTimerLookPage() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [total, setTotal] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const deadline = useRef(0);

  useEffect(() => {
    if (phase !== "run") return;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(tick);
        setPhase("log");
      }
    }, 250);
    return () => clearInterval(tick);
  }, [phase]);

  function start(seconds: number) {
    setTotal(seconds);
    setRemaining(seconds);
    deadline.current = Date.now() + seconds * 1000;
    setPhase("run");
  }

  /* ring geometry — r=64 puts the circumference at ~402 */
  const RING_C = 2 * Math.PI * 64;
  const ringOffset = RING_C * (1 - remaining / total);

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .mini-timer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        button.mini-timer-tile:not([type="submit"]):not(.wv-header-signout) {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 22px 8px;
          background: var(--wv-white);
          border: 2.5px solid var(--accent);
          border-radius: var(--corners);
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
          cursor: pointer;
          transition: scale 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-timer-tile:not([type="submit"]):not(.wv-header-signout):hover { scale: 1.05; }
        button.mini-timer-tile:not([type="submit"]):not(.wv-header-signout):active { scale: 0.94; }
        button.mini-timer-tile:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-timer-secs {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 30px;
          color: var(--wv-cadet);
        }
        .mini-timer-word {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-cadet);
        }
        .mini-timer-run {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 18px;
        }
        .mini-timer-count {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 56px;
          fill: var(--wv-cadet);
        }
        .mini-timer-go {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--wv-cadet);
          margin-top: 16px;
          animation: miniGoPulse 1.2s ease-in-out infinite;
        }
        @keyframes miniGoPulse {
          0%, 100% { scale: 1; }
          50%      { scale: 1.08; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mini-timer-go { animation: none; }
        }
      `}</style>

      {phase === "pick" && (
        <div className="mini-timer-grid">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              type="button"
              className="mini-timer-tile"
              onClick={() => start(d.seconds)}
              style={{
                ["--accent" as string]: d.accent,
                ["--corners" as string]: d.corners,
              }}
            >
              <span className="mini-timer-secs">{d.seconds}</span>
              <span className="mini-timer-word">{d.label}</span>
            </button>
          ))}
        </div>
      )}

      {phase === "run" && (
        <div className="mini-timer-run" role="timer" aria-live="off">
          <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
            <circle
              cx="80" cy="80" r="64"
              fill="var(--wv-white)"
              stroke="rgba(39, 50, 72, 0.08)"
              strokeWidth="10"
            />
            <circle
              cx="80" cy="80" r="64"
              fill="none"
              stroke="var(--wv-redwood)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 80 80)"
              style={{ transition: "stroke-dashoffset 250ms linear" }}
            />
            <text
              x="80" y="80"
              textAnchor="middle"
              dominantBaseline="central"
              className="mini-timer-count"
            >
              {remaining}
            </text>
          </svg>
          <p className="mini-timer-go">go go go — grab everything you can!</p>
        </div>
      )}

      {phase === "log" && (
        <FoundPicker prompt="time's up! tap everything you grabbed!" />
      )}
    </div>
  );
}
