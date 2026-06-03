"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type {
  BeatSequencerConfig,
  BeatVoice,
  Participant,
} from "@/lib/types";

interface Props {
  config: BeatSequencerConfig;
  role: "facilitator" | "participant";
  onSubmit?: (response: unknown) => void;
  responses?: Record<string, unknown>;
  participants?: Record<string, Participant>;
  submitted?: boolean;
}

interface SequencerResponse {
  pattern: boolean[][];
  tempo: number;
  feel: number;
  reflection?: string;
}

// ── synth voices (ported from apps/rhythm-lab/components/beat-grid.tsx) ──
// Pure Web Audio — no samples, so nothing to load and nothing to block on.

function createKick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(100, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

function createSnare(ctx: AudioContext, time: number) {
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(time);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 200;
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.5, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(oscGain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

function createHiHat(ctx: AudioContext, time: number) {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 8000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(time);
}

function createClap(ctx: AudioContext, time: number) {
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000;
  filter.Q.value = 1;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(time);
}

const VOICES: Record<BeatVoice, (ctx: AudioContext, time: number) => void> = {
  kick: createKick,
  snare: createSnare,
  hihat: createHiHat,
  clap: createClap,
};

// ── helpers ──────────────────────────────────────────────────────

function emptyGrid(rows: number, steps: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(steps).fill(false));
}

/** ms per step. 4 steps = quarters, 8 = eighths, 16 = sixteenths. */
function stepDurationMs(tempo: number, steps: number): number {
  return 240_000 / (tempo * steps);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

export function BeatSequencerActivity({
  config,
  role,
  onSubmit,
  responses,
  participants,
  submitted,
}: Props) {
  const rows = config.rows;
  const steps = config.steps;
  const [tempoMin, tempoMax] = config.tempoRange ?? [60, 160];
  const reducedMotion = usePrefersReducedMotion();

  // grid seeds from the first preset (so there's immediate sound) or empty.
  const initialGrid = useMemo(
    () => config.presets?.[0]?.grid ?? emptyGrid(rows.length, steps),
    [config.presets, rows.length, steps],
  );

  const [grid, setGrid] = useState<boolean[][]>(initialGrid);
  const [tempo, setTempo] = useState(config.tempo);
  const [feel, setFeel] = useState(0); // 0..1 swing amount
  const [playing, setPlaying] = useState(false);
  const [activeCol, setActiveCol] = useState(-1);
  const [reflection, setReflection] = useState("");

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const colRef = useRef(0);

  // refs mirror state so the scheduler closure never goes stale
  const gridRef = useRef(grid);
  const tempoRef = useRef(tempo);
  const feelRef = useRef(feel);
  const playingRef = useRef(playing);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { tempoRef.current = tempo; }, [tempo]);
  useEffect(() => { feelRef.current = feel; }, [feel]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // iOS keeps a freshly-created AudioContext muted until a sound is started
  // inside a user gesture. A 1-frame silent buffer on first touch unlocks it.
  const unlockedRef = useRef(false);
  const unlockAudio = useCallback(() => {
    const ctx = getCtx();
    if (unlockedRef.current) return;
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    unlockedRef.current = true;
  }, [getCtx]);

  const toggle = (row: number, col: number) => {
    unlockAudio(); // first-gesture unlock for iOS/mobile
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = !next[row][col];
      return next;
    });
  };

  const step = useCallback(() => {
    const ctx = getCtx();
    const col = colRef.current;
    setActiveCol(col);
    const g = gridRef.current;
    const stepSec = stepDurationMs(tempoRef.current, steps) / 1000;
    // off-beats (odd steps) land late when feel > 0 — that lateness IS swing.
    const swing = col % 2 === 1 ? feelRef.current * stepSec * 0.4 : 0;
    rows.forEach((r, rowIdx) => {
      if (g[rowIdx]?.[col]) VOICES[r.instrument](ctx, ctx.currentTime + swing);
    });
    colRef.current = (col + 1) % steps;
  }, [getCtx, rows, steps]);

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    setActiveCol(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const startPlayback = useCallback(() => {
    unlockAudio();
    colRef.current = 0;
    setPlaying(true);
    step();
    const tick = () => {
      if (!playingRef.current) return;
      const ms = stepDurationMs(tempoRef.current, steps);
      timerRef.current = window.setTimeout(() => {
        step();
        tick();
      }, ms);
    };
    const ms = stepDurationMs(tempoRef.current, steps);
    timerRef.current = window.setTimeout(tick, ms);
  }, [unlockAudio, step, steps]);

  // autoplay: start on the first user gesture anywhere on the page (browsers
  // block audio before a gesture). One-shot listener; cleaned up after firing.
  useEffect(() => {
    if (!config.autoplay || role !== "participant" || submitted) return;
    const onFirstGesture = () => {
      if (!playingRef.current) startPlayback();
      window.removeEventListener("pointerdown", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, [config.autoplay, role, submitted, startPlayback]);

  // teardown on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const loadPreset = (presetGrid: boolean[][]) => {
    getCtx();
    setGrid(presetGrid.map((r) => [...r]));
  };

  const handleSubmit = () => {
    if (config.reflectionPrompt && !reflection.trim()) return;
    const response: SequencerResponse = {
      pattern: gridRef.current.map((r) => [...r]),
      tempo,
      feel,
      ...(config.reflectionPrompt ? { reflection: reflection.trim() } : {}),
    };
    onSubmit?.(response);
  };

  // ── participant: submitted ────────────────────────────────────
  if (role === "participant" && submitted) {
    return (
      <div className="text-center py-6 text-[var(--rh-text-muted)]">
        <p className="text-2xl mb-2">🥁</p>
        <p className="text-sm">pattern submitted — waiting for the group</p>
      </div>
    );
  }

  // ── facilitator: results ──────────────────────────────────────
  if (role === "facilitator") {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">{config.prompt}</h3>
        {responses ? (
          <div className="space-y-3">
            {Object.entries(responses).map(([pid, response]) => {
              const sub = response as SequencerResponse;
              const name =
                participants?.[pid]?.displayName ||
                `participant ${Object.keys(responses).indexOf(pid) + 1}`;
              const hits = sub.pattern?.flat().filter(Boolean).length ?? 0;
              return (
                <div key={pid} className="p-3 rounded-xl bg-white border border-black/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--rh-text-muted)]">
                      {name}
                    </span>
                    <span className="text-xs font-mono font-bold text-[var(--rh-teal)]">
                      {sub.tempo} bpm · {hits} hits
                      {sub.feel > 0 ? ` · feel ${Math.round(sub.feel * 100)}%` : ""}
                    </span>
                  </div>
                  {sub.reflection && (
                    <p className="text-sm italic text-[var(--rh-text)]">
                      &ldquo;{sub.reflection}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--rh-text-muted)]">
            patterns are hidden — click &quot;reveal results&quot; to show
          </p>
        )}
      </div>
    );
  }

  // ── participant: interactive ──────────────────────────────────
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{config.prompt}</h3>

      <div className="space-y-5">
        {/* presets */}
        {config.presets && config.presets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.presets.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p.grid)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--rh-cyan)]/30 text-[var(--rh-teal)] hover:bg-[var(--rh-cyan)]/10 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* grid */}
        <div className="space-y-2">
          {rows.map((r, rowIdx) => (
            <div key={`${r.instrument}-${rowIdx}`} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-[var(--rh-text-muted)] text-right">
                {r.label}
              </span>
              <div className="flex gap-1.5 flex-1">
                {Array.from({ length: steps }).map((_, colIdx) => {
                  const on = grid[rowIdx]?.[colIdx] ?? false;
                  const isActive = activeCol === colIdx;
                  const beatStart = colIdx % (steps / 4 || 1) === 0;
                  return (
                    <button
                      key={colIdx}
                      aria-label={`${r.label} step ${colIdx + 1} ${on ? "on" : "off"}`}
                      aria-pressed={on}
                      onClick={() => toggle(rowIdx, colIdx)}
                      className="flex-1 aspect-square rounded-md border transition-colors duration-75"
                      style={{
                        background: on ? "var(--rh-cyan)" : "var(--rh-sand)",
                        borderColor: isActive
                          ? "var(--rh-teal)"
                          : beatStart
                            ? "rgba(13,79,79,0.25)"
                            : "rgba(13,79,79,0.08)",
                        boxShadow:
                          isActive && !reducedMotion
                            ? "0 0 10px var(--rh-foam)"
                            : "none",
                        transform:
                          isActive && on && !reducedMotion ? "scale(1.08)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* transport + tempo */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={playing ? stopPlayback : startPlayback}
            className="px-6 py-2 rounded-xl font-semibold text-sm text-white transition-colors"
            style={{ background: playing ? "var(--rh-teal)" : "var(--rh-cyan)" }}
          >
            {playing ? "stop" : "play"}
          </button>
          <div className="flex items-center gap-3 flex-1 w-full">
            <label htmlFor="bs-tempo" className="text-xs text-[var(--rh-text-muted)]">
              tempo
            </label>
            <input
              id="bs-tempo"
              type="range"
              min={tempoMin}
              max={tempoMax}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: "var(--rh-cyan)" }}
            />
            <span className="text-xs font-mono text-[var(--rh-text-muted)] w-14 text-right">
              {tempo} bpm
            </span>
          </div>
        </div>

        {/* feel / swing slider */}
        {config.feel && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="bs-feel" className="text-sm font-medium">
                {config.feel.label}
              </label>
            </div>
            <input
              id="bs-feel"
              type="range"
              min={0}
              max={100}
              value={Math.round(feel * 100)}
              onChange={(e) => setFeel(Number(e.target.value) / 100)}
              className="w-full"
              style={{ accentColor: "var(--rh-cyan)" }}
            />
            <div className="flex justify-between text-[10px] text-[var(--rh-text-muted)]">
              <span>{config.feel.lowLabel}</span>
              <span>{config.feel.highLabel}</span>
            </div>
          </div>
        )}

        {/* toy bridge */}
        {config.toyLink && (
          <a
            href={config.toyLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl border border-[var(--rh-cyan)]/40 text-[var(--rh-teal)] text-sm font-semibold hover:bg-[var(--rh-cyan)]/10 transition-colors"
          >
            {config.toyLink.label}
          </a>
        )}

        {/* reflection (optional) */}
        {config.reflectionPrompt && (
          <div>
            <p className="text-sm font-medium mb-2">{config.reflectionPrompt}</p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="what do you hear?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--rh-cyan)]/30"
            />
          </div>
        )}

        {/* submit */}
        <button
          onClick={handleSubmit}
          disabled={!!config.reflectionPrompt && !reflection.trim()}
          className="w-full py-3 rounded-xl bg-[var(--rh-cyan)] text-white font-semibold hover:bg-[var(--rh-teal)] transition-colors disabled:opacity-30"
        >
          {config.reflectionPrompt ? "submit" : "i'm ready"}
        </button>
      </div>
    </div>
  );
}
