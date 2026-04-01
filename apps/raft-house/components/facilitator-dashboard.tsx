"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { RoomState, FacilitatorMessage } from "@/lib/types";
import { downloadReport, generateSessionReport } from "@/lib/export";
import { ActivityRenderer } from "./activity-renderer";
import { TimerDisplay } from "./timer-display";

interface Props {
  state: RoomState;
  send: (msg: FacilitatorMessage) => void;
  connected: boolean;
}

export function FacilitatorDashboard({ state, send, connected }: Props) {
  const activity = state.activities[state.currentActivityIndex];
  const participants = Object.values(state.participants);
  const connectedCount = participants.filter(
    (p) => p.connectionStatus === "connected",
  ).length;

  const joinUrl = `https://windedvertigo.com/harbour/raft-house/play/${state.code}`;
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [joinUrl]);

  const submittedCount = activity
    ? participants.filter((p) => p.responses[activity.id] !== undefined).length
    : 0;

  const handleAdvance = useCallback(() => send({ type: "advance" }), [send]);
  const handleReveal = useCallback(
    () => send({ type: "reveal-results" }),
    [send],
  );
  const handlePause = useCallback(
    () => send({ type: state.status === "paused" ? "resume" : "pause" }),
    [send, state.status],
  );
  const handleToggleMode = useCallback(
    () =>
      send({
        type: "set-mode",
        mode: state.mode === "sync" ? "async" : "sync",
      }),
    [send, state.mode],
  );
  const handleEndSession = useCallback(
    () => send({ type: "end-session" }),
    [send],
  );

  const handleStartTimer = useCallback(
    (seconds: number) => send({ type: "timer-start", durationMs: seconds * 1000 }),
    [send],
  );

  const handleExport = useCallback(() => downloadReport(state), [state]);

  // ── auto-save to Notion when session completes ─────────────────
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const savedRef = useRef(false);

  useEffect(() => {
    if (state.status !== "completed" || savedRef.current) return;
    savedRef.current = true;
    setSaveStatus("saving");

    // read session name from sessionStorage (set during session creation)
    let sessionName = state.code;
    let template = "";
    try {
      const stored = sessionStorage.getItem(`raft:${state.code}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionName = parsed.sessionName || sessionName;
        template = parsed.template || "";
      }
    } catch {
      // ignore
    }

    const report = generateSessionReport(state);

    fetch("/harbour/raft-house/api/save-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionName,
        code: state.code,
        template,
        facilitator: "",
        participantCount: participants.length,
        activityCount: state.activities.length,
        date: new Date(state.createdAt).toISOString(),
        results: report,
      }),
    })
      .then((res) => {
        setSaveStatus(res.ok ? "saved" : "error");
      })
      .catch(() => {
        setSaveStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally fire only when status transitions to completed
  }, [state.status, state.code]);

  if (state.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">🛶</p>
          <h1 className="text-2xl font-bold mb-2">session complete</h1>
          <p className="text-[var(--rh-text-muted)] mb-6">
            {participants.length} participants crossed with you.
          </p>

          {/* save status indicator */}
          <p className="text-xs text-[var(--rh-text-muted)] mb-4">
            {saveStatus === "saving" && "saving to history..."}
            {saveStatus === "saved" && "✓ saved to session history"}
            {saveStatus === "error" && "could not save — download results below"}
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors"
            >
              export results
            </button>
            <Link
              href="/facilitate/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors"
            >
              view session history
            </Link>
            <Link
              href="/facilitate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--rh-teal)] text-white text-sm font-semibold hover:bg-[var(--rh-deep)] transition-colors"
            >
              start another session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rh-sand-light)]">
      {/* ── top bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 pulse-live" : "bg-red-500"}`}
            />
            <span className="font-mono text-lg font-bold tracking-wider">
              {state.code}
            </span>
            <span className="text-xs text-[var(--rh-text-muted)]">
              {connectedCount} connected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMode}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-black/10 hover:bg-black/5 transition-colors"
            >
              {state.mode === "sync" ? "🔒 sync" : "🔓 async"}
            </button>
            <button
              onClick={handlePause}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-black/10 hover:bg-black/5 transition-colors"
            >
              {state.status === "paused" ? "▶ resume" : "⏸ pause"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── left: activity sequence ────────────────────────── */}
        <div className="lg:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-text-muted)] mb-3">
            activity sequence
          </h2>
          <div className="space-y-1.5">
            {state.activities.map((act, i) => {
              const isCurrent = i === state.currentActivityIndex;
              const isPast = i < state.currentActivityIndex;
              return (
                <button
                  key={act.id}
                  onClick={() => send({ type: "goto", activityIndex: i })}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2.5 ${
                    isCurrent
                      ? "bg-[var(--rh-teal)] text-white shadow-sm"
                      : isPast
                        ? "bg-black/5 text-[var(--rh-text-muted)]"
                        : "hover:bg-black/5"
                  }`}
                >
                  <span className={`phase-dot phase-${act.phase} flex-shrink-0`} />
                  <span className="flex-1 truncate">{act.label}</span>
                  {isPast && <span className="text-xs opacity-50">✓</span>}
                  {isCurrent && <span className="text-xs opacity-70">→</span>}
                </button>
              );
            })}
          </div>

          {/* timer controls */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-text-muted)] mb-2">
              timer
            </h3>
            {state.timer ? (
              <TimerDisplay timer={state.timer} />
            ) : (
              <div className="flex gap-2">
                {[60, 120, 180, 300].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStartTimer(s)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-black/10 hover:bg-black/5 transition-colors"
                  >
                    {s >= 60 ? `${s / 60}m` : `${s}s`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* session controls */}
          <div className="mt-6 pt-4 border-t border-black/10 flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-xs border border-black/10 hover:bg-black/5 transition-colors"
            >
              export results
            </button>
            <button
              onClick={handleEndSession}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              end session
            </button>
          </div>
        </div>

        {/* ── center: current activity ──────────────────────── */}
        <div className="lg:col-span-1">
          {activity ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`phase-dot phase-${activity.phase}`} />
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--rh-text-muted)]">
                  {activity.phase}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                <ActivityRenderer
                  activity={activity}
                  role="facilitator"
                  responses={
                    state.resultsRevealed
                      ? Object.fromEntries(
                          Object.entries(state.participants)
                            .filter(([, p]) => p.responses[activity.id] !== undefined)
                            .map(([id, p]) => [id, p.responses[activity.id]]),
                        )
                      : undefined
                  }
                  participants={state.participants}
                />
              </div>

              {/* facilitator action buttons */}
              <div className="flex gap-3 mt-4">
                {!state.resultsRevealed && (
                  <button
                    onClick={handleReveal}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--rh-cyan)] text-white text-sm font-semibold hover:bg-[var(--rh-teal)] transition-colors"
                  >
                    reveal results ({submittedCount}/{participants.length})
                  </button>
                )}
                {state.currentActivityIndex >= state.activities.length - 1 ? (
                  <button
                    onClick={handleEndSession}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    end session
                  </button>
                ) : (
                  <button
                    onClick={handleAdvance}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--rh-deep)] text-white text-sm font-semibold hover:bg-black transition-colors"
                  >
                    next &rarr;
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--rh-text-muted)]">
              <p>no activities loaded</p>
            </div>
          )}
        </div>

        {/* ── right: participant monitor ─────────────────────── */}
        <div className="lg:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-text-muted)] mb-3">
            participants ({participants.length})
          </h2>

          {/* ── join link + QR code ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-black/5 p-5 mb-4 text-center">
            {participants.length === 0 && (
              <p className="text-sm text-[var(--rh-text-muted)] mb-3">
                waiting for participants...
              </p>
            )}
            <div className="inline-block p-3 bg-white rounded-xl border border-black/5">
              <QRCodeSVG
                value={joinUrl}
                size={180}
                level="M"
                bgColor="transparent"
                fgColor="var(--rh-deep, #1a1a2e)"
              />
            </div>
            <p className="font-mono text-2xl font-bold tracking-wider text-[var(--rh-text)] mt-3">
              {state.code}
            </p>
            <p className="text-xs text-[var(--rh-text-muted)] mt-1 mb-3 break-all">
              {joinUrl}
            </p>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-black/10 hover:bg-black/5 transition-colors"
            >
              {copied ? "✓ copied" : "copy link"}
            </button>
          </div>

          {/* ── participant list ─────────────────────────────── */}
          {participants.length > 0 && (
            <div className="space-y-1.5">
              {participants.map((p) => {
                const hasResponded = activity && p.responses[activity.id] !== undefined;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-black/5"
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        p.connectionStatus === "connected"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="flex-1 text-sm truncate">
                      {p.displayName}
                    </span>
                    {p.role === "guide" && (
                      <span className="text-xs bg-[var(--rh-sand)] px-1.5 py-0.5 rounded-full">
                        guide
                      </span>
                    )}
                    {hasResponded ? (
                      <span className="text-xs text-green-600">✓</span>
                    ) : (
                      <span className="text-xs text-[var(--rh-text-muted)]">
                        ...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
