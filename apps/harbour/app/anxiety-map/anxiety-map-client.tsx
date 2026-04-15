"use client";

import {
  useState,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import "./anxiety-map.css";
import type {
  HCA,
  PCRRating,
  MapSession,
  MapAction,
  Phase,
  NetworkNode,
  NetworkEdge,
  DirectedPair,
} from "./lib/types";
import {
  assignColour,
  assignShape,
  generatePairs,
  minPairsRequired,
  computeEdges,
  computeNodes,
  selectFocusNodes,
  getConnectedLabels,
  edgePath,
  nodeRadius,
} from "./lib/network-math";
import { PRESET_HCAS } from "./lib/presets";

/* ── constants ────────────────────────────────────────────────── */

const SESSION_KEY = "am-session";
const STRENGTH_OPTIONS = [
  { value: 0, label: "not at all", size: 0 },
  { value: 1, label: "a little", size: 10 },
  { value: 2, label: "some", size: 16 },
  { value: 3, label: "quite a lot", size: 22 },
  { value: 4, label: "a lot", size: 28 },
] as const;

const FREQ_SIZES = [16, 22, 28, 34] as const;

/* ── reducer ─────────────────────────────────────────────────── */

function initialState(): MapSession {
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return {
    phase: "input",
    childName: "",
    hcas: [],
    ratings: [],
    currentPairIndex: 0,
  };
}

function reducer(state: MapSession, action: MapAction): MapSession {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, childName: action.name };

    case "ADD_HCA": {
      const idx = state.hcas.length;
      const hca: HCA = {
        id: crypto.randomUUID(),
        label: action.label.toLowerCase().trim(),
        frequency: action.frequency,
        color: assignColour(idx),
        shape: assignShape(idx),
      };
      return { ...state, hcas: [...state.hcas, hca] };
    }

    case "REMOVE_HCA": {
      const hcas = state.hcas.filter((h) => h.id !== action.id);
      const ratings = state.ratings.filter(
        (r) => r.sourceId !== action.id && r.targetId !== action.id,
      );
      return { ...state, hcas, ratings };
    }

    case "SET_FREQUENCY":
      return {
        ...state,
        hcas: state.hcas.map((h) =>
          h.id === action.id ? { ...h, frequency: action.frequency } : h,
        ),
      };

    case "RATE_PAIR": {
      const existing = state.ratings.findIndex(
        (r) => r.sourceId === action.sourceId && r.targetId === action.targetId,
      );
      const rating: PCRRating = {
        sourceId: action.sourceId,
        targetId: action.targetId,
        strength: action.strength,
      };
      const ratings =
        existing >= 0
          ? state.ratings.map((r, i) => (i === existing ? rating : r))
          : [...state.ratings, rating];
      return { ...state, ratings };
    }

    case "NEXT_PAIR":
      return { ...state, currentPairIndex: state.currentPairIndex + 1 };

    case "SKIP_PAIR":
      return { ...state, currentPairIndex: state.currentPairIndex + 1 };

    case "SET_PHASE":
      return { ...state, phase: action.phase, currentPairIndex: 0 };

    case "RESET":
      return {
        phase: "input",
        childName: "",
        hcas: [],
        ratings: [],
        currentPairIndex: 0,
      };

    default:
      return state;
  }
}

/* ── hooks ────────────────────────────────────────────────────── */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ── main component ──────────────────────────────────────────── */

export function AnxietyMapClient() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const reducedMotion = useReducedMotion();

  // persist to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // screen reader live region
  const [announcement, setAnnouncement] = useState("");

  const setPhase = useCallback(
    (phase: Phase) => {
      dispatch({ type: "SET_PHASE", phase });
      const labels: Record<Phase, string> = {
        input: "name your worries",
        mapping: "how do they connect",
        visualisation: "the map",
        focus: "where to start",
      };
      setAnnouncement(`moved to: ${labels[phase]}`);
    },
    [],
  );

  return (
    <div className="am-root">
      <a href="/harbour" className="am-back" aria-label="back to the harbour">
        ← harbour
      </a>

      {state.phase === "input" && (
        <InputPhase
          state={state}
          dispatch={dispatch}
          onContinue={() => setPhase("mapping")}
        />
      )}
      {state.phase === "mapping" && (
        <MappingPhase
          state={state}
          dispatch={dispatch}
          onDone={() => setPhase("visualisation")}
          onBack={() => setPhase("input")}
        />
      )}
      {state.phase === "visualisation" && (
        <VisualisationPhase
          state={state}
          dispatch={dispatch}
          onFocus={() => setPhase("focus")}
          onBack={() => setPhase("mapping")}
          reducedMotion={reducedMotion}
        />
      )}
      {state.phase === "focus" && (
        <FocusPhase
          state={state}
          dispatch={dispatch}
          onBack={() => setPhase("visualisation")}
          reducedMotion={reducedMotion}
        />
      )}

      {/* screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="am-sr-only">
        {announcement}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   phase 1: input — "name your worries"
   ══════════════════════════════════════════════════════════════════ */

function InputPhase({
  state,
  dispatch,
  onContinue,
}: {
  state: MapSession;
  dispatch: React.Dispatch<MapAction>;
  onContinue: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [draftFreq, setDraftFreq] = useState(2);
  const [showPresets, setShowPresets] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addHCA = useCallback(() => {
    const label = draft.trim();
    if (!label) return;
    if (state.hcas.some((h) => h.label === label.toLowerCase())) return;
    dispatch({ type: "ADD_HCA", label, frequency: draftFreq });
    setDraft("");
    setDraftFreq(2);
    inputRef.current?.focus();
  }, [draft, draftFreq, dispatch, state.hcas]);

  const addPreset = useCallback(
    (label: string) => {
      if (state.hcas.some((h) => h.label === label.toLowerCase())) return;
      dispatch({ type: "ADD_HCA", label, frequency: 2 });
    },
    [dispatch, state.hcas],
  );

  const canContinue = state.hcas.length >= 3;

  return (
    <div className="am-phase" role="region" aria-label="name your worries">
      <div className="am-title">
        {state.childName
          ? `what makes ${state.childName} anxious?`
          : "what are the worries?"}
      </div>
      <div className="am-subtitle">
        add the things that cause anxiety — one at a time. you can pick from
        common ones or type your own.
      </div>

      {/* optional child name */}
      {!state.childName && state.hcas.length === 0 && (
        <input
          className="am-input am-name-input"
          type="text"
          placeholder="child's name (optional)"
          maxLength={40}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) dispatch({ type: "SET_NAME", name: val });
            }
          }}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val) dispatch({ type: "SET_NAME", name: val });
          }}
          aria-label="child's name"
        />
      )}

      {/* frequency selector for draft */}
      {draft.trim() && (
        <div className="am-freq">
          <span className="am-freq-label">how often?</span>
          {FREQ_SIZES.map((size, i) => (
            <button
              key={i}
              className="am-freq-dot"
              data-active={draftFreq === i + 1}
              style={{ width: size, height: size }}
              onClick={() => setDraftFreq(i + 1)}
              aria-label={`frequency ${i + 1} of 4`}
              aria-pressed={draftFreq === i + 1}
            />
          ))}
        </div>
      )}

      {/* input row */}
      <div className="am-input-row">
        <input
          ref={inputRef}
          className="am-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addHCA();
          }}
          placeholder="type a worry…"
          maxLength={60}
          aria-label="type a worry"
        />
        <button
          className="am-btn am-btn-primary"
          onClick={addHCA}
          disabled={!draft.trim()}
          aria-label="add worry"
        >
          add
        </button>
      </div>

      {/* preset library */}
      <button
        className="am-presets-toggle"
        onClick={() => setShowPresets(!showPresets)}
        aria-expanded={showPresets}
      >
        {showPresets ? "hide common worries" : "show common worries"}
      </button>

      {showPresets && (
        <div className="am-chips" role="list" aria-label="common worries">
          {PRESET_HCAS.map((p) => {
            const added = state.hcas.some(
              (h) => h.label === p.label.toLowerCase(),
            );
            return (
              <button
                key={p.label}
                className="am-chip"
                data-selected={added}
                onClick={() => !added && addPreset(p.label)}
                disabled={added}
                role="listitem"
                aria-label={`${p.label}${added ? " (already added)" : ""}`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* current HCAs */}
      {state.hcas.length > 0 && (
        <div className="am-chips" role="list" aria-label="added worries">
          {state.hcas.map((hca) => (
            <div key={hca.id} className="am-chip" role="listitem">
              <span
                className="am-chip-dot"
                style={{ background: hca.color }}
              />
              <span>{hca.label}</span>
              {/* frequency dots inline */}
              <span style={{ display: "flex", gap: 2, marginLeft: 4 }}>
                {[1, 2, 3, 4].map((f) => (
                  <button
                    key={f}
                    className="am-freq-dot"
                    data-active={hca.frequency >= f}
                    style={{ width: 8 + f * 3, height: 8 + f * 3 }}
                    onClick={() =>
                      dispatch({
                        type: "SET_FREQUENCY",
                        id: hca.id,
                        frequency: f,
                      })
                    }
                    aria-label={`set frequency of ${hca.label} to ${f}`}
                  />
                ))}
              </span>
              <button
                className="am-chip-remove"
                onClick={() => dispatch({ type: "REMOVE_HCA", id: hca.id })}
                aria-label={`remove ${hca.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* continue */}
      <button
        className="am-btn am-btn-primary"
        onClick={onContinue}
        disabled={!canContinue}
        aria-label={
          canContinue
            ? "continue to connect worries"
            : `add at least ${3 - state.hcas.length} more ${3 - state.hcas.length === 1 ? "worry" : "worries"}`
        }
      >
        {canContinue
          ? "connect them →"
          : `add ${3 - state.hcas.length} more to continue`}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   phase 2: mapping — "how do they connect?"
   ══════════════════════════════════════════════════════════════════ */

function MappingPhase({
  state,
  dispatch,
  onDone,
  onBack,
}: {
  state: MapSession;
  dispatch: React.Dispatch<MapAction>;
  onDone: () => void;
  onBack: () => void;
}) {
  const pairs = useMemo(() => generatePairs(state.hcas), [state.hcas]);
  const totalPairs = pairs.length;
  const currentIdx = state.currentPairIndex;
  const minRequired = minPairsRequired(state.hcas.length);
  const canExit = currentIdx >= minRequired;
  const isDone = currentIdx >= totalPairs;

  // auto-advance when all pairs are rated
  useEffect(() => {
    if (isDone) onDone();
  }, [isDone, onDone]);

  if (isDone) return null;

  const pair = pairs[currentIdx];
  const source = state.hcas.find((h) => h.id === pair.sourceId)!;
  const target = state.hcas.find((h) => h.id === pair.targetId)!;

  // check if this pair has already been rated (e.g. from sessionStorage restore)
  const existingRating = state.ratings.find(
    (r) => r.sourceId === pair.sourceId && r.targetId === pair.targetId,
  );

  const ratePair = (strength: number) => {
    dispatch({
      type: "RATE_PAIR",
      sourceId: pair.sourceId,
      targetId: pair.targetId,
      strength,
    });
    dispatch({ type: "NEXT_PAIR" });
  };

  return (
    <div className="am-phase" role="region" aria-label="connect worries">
      <div className="am-title">how do they connect?</div>

      <div className="am-pair">
        {/* the two nodes */}
        <div className="am-pair-nodes">
          <div className="am-pair-node">
            <div
              className="am-pair-bubble"
              style={{ background: source.color }}
              aria-hidden="true"
            />
            <span className="am-pair-label">{source.label}</span>
          </div>

          <span className="am-pair-arrow" aria-hidden="true">
            →
          </span>

          <div className="am-pair-node">
            <div
              className="am-pair-bubble"
              style={{ background: target.color }}
              aria-hidden="true"
            />
            <span className="am-pair-label">{target.label}</span>
          </div>
        </div>

        {/* question */}
        <p className="am-pair-question">
          does worrying about{" "}
          <strong>{source.label}</strong> make worrying about{" "}
          <strong>{target.label}</strong> worse?
        </p>

        {/* strength selector */}
        <div
          className="am-strength"
          role="radiogroup"
          aria-label="how much does this worry cause the other"
        >
          {STRENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="am-strength-btn"
              data-selected={existingRating?.strength === opt.value}
              onClick={() => ratePair(opt.value)}
              role="radio"
              aria-checked={existingRating?.strength === opt.value}
              aria-label={opt.label}
            >
              {opt.size > 0 && (
                <span
                  className="am-strength-ring"
                  style={{ width: opt.size, height: opt.size }}
                  aria-hidden="true"
                />
              )}
              <span className="am-strength-label">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* controls */}
        <div className="am-map-controls">
          <button className="am-btn am-btn-ghost" onClick={onBack}>
            ← back
          </button>
          <button
            className="am-btn am-btn-ghost"
            onClick={() => dispatch({ type: "SKIP_PAIR" })}
          >
            skip
          </button>
          {canExit && (
            <button className="am-btn am-btn-secondary" onClick={onDone}>
              show the map →
            </button>
          )}
        </div>
      </div>

      {/* progress dots */}
      <div
        className="am-progress"
        role="progressbar"
        aria-valuenow={currentIdx}
        aria-valuemin={0}
        aria-valuemax={totalPairs}
        aria-label={`${currentIdx} of ${totalPairs} connections rated`}
      >
        {pairs.map((_, i) => (
          <span
            key={i}
            className="am-progress-dot"
            data-done={i < currentIdx}
            data-current={i === currentIdx}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   phase 3: visualisation — "the map"
   ══════════════════════════════════════════════════════════════════ */

function VisualisationPhase({
  state,
  dispatch,
  onFocus,
  onBack,
  reducedMotion,
}: {
  state: MapSession;
  dispatch: React.Dispatch<MapAction>;
  onFocus: () => void;
  onBack: () => void;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setDims({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const edges = useMemo(() => computeEdges(state.ratings), [state.ratings]);
  const nodes = useMemo(
    () => computeNodes(state.hcas, edges, dims.w, dims.h),
    [state.hcas, edges, dims.w, dims.h],
  );
  const focusIds = useMemo(() => selectFocusNodes(nodes), [nodes]);

  // build node position map for edge rendering
  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of nodes) m.set(n.hca.id, { x: n.x, y: n.y });
    return m;
  }, [nodes]);

  return (
    <div className="am-phase" role="region" aria-label="anxiety map">
      <div className="am-graph-wrap" ref={containerRef}>
        <svg
          className="am-graph-svg"
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          role="img"
          aria-label={`anxiety map showing ${nodes.length} worries. ${
            focusIds.length > 0
              ? `the most central worry is ${nodes.find((n) => n.hca.id === focusIds[0])?.hca.label ?? "unknown"}`
              : ""
          }`}
        >
          <defs>
            {/* gradient definitions for edge direction */}
            {edges.map((edge) => {
              const src = posMap.get(edge.sourceId);
              const tgt = posMap.get(edge.targetId);
              if (!src || !tgt) return null;
              const srcNode = nodes.find((n) => n.hca.id === edge.sourceId);
              return (
                <linearGradient
                  key={`g-${edge.sourceId}-${edge.targetId}`}
                  id={`g-${edge.sourceId}-${edge.targetId}`}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor={srcNode?.hca.color ?? "#fff"} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={srcNode?.hca.color ?? "#fff"} stopOpacity={0.1} />
                </linearGradient>
              );
            })}
          </defs>

          {/* edges */}
          {edges.map((edge) => {
            const src = posMap.get(edge.sourceId);
            const tgt = posMap.get(edge.targetId);
            if (!src || !tgt) return null;
            const dimmed =
              selectedId !== null &&
              edge.sourceId !== selectedId &&
              edge.targetId !== selectedId;
            return (
              <path
                key={`e-${edge.sourceId}-${edge.targetId}`}
                className="am-graph-edge"
                d={edgePath(src.x, src.y, tgt.x, tgt.y)}
                stroke={`url(#g-${edge.sourceId}-${edge.targetId})`}
                strokeWidth={1 + edge.strength * 1.5}
                opacity={dimmed ? 0.1 : 1}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((node) => {
            const r = nodeRadius(node.centrality);
            const isFocus = focusIds.includes(node.hca.id);
            const dimmed =
              selectedId !== null && node.hca.id !== selectedId &&
              !edges.some(
                (e) =>
                  (e.sourceId === selectedId && e.targetId === node.hca.id) ||
                  (e.targetId === selectedId && e.sourceId === node.hca.id),
              );
            return (
              <g
                key={node.hca.id}
                className="am-graph-node"
                onClick={() =>
                  setSelectedId(
                    selectedId === node.hca.id ? null : node.hca.id,
                  )
                }
                opacity={dimmed ? 0.2 : 1}
                role="button"
                tabIndex={0}
                aria-label={`${node.hca.label}, causes ${node.outStrength} strength to other worries, caused by ${node.inStrength} from others`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(
                      selectedId === node.hca.id ? null : node.hca.id,
                    );
                  }
                }}
              >
                {/* glow ring for central nodes */}
                {isFocus && !reducedMotion && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 8}
                    fill="none"
                    stroke={node.hca.color}
                    strokeWidth={3}
                    className="am-glow-ring"
                  />
                )}
                {isFocus && reducedMotion && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 8}
                    fill="none"
                    stroke={node.hca.color}
                    strokeWidth={3}
                    opacity={0.5}
                  />
                )}

                {/* main node */}
                <NodeShape
                  shape={node.hca.shape}
                  x={node.x}
                  y={node.y}
                  r={r}
                  fill={node.hca.color}
                />

                {/* label */}
                <text
                  x={node.x}
                  y={node.y + r + 14}
                  className="am-graph-node-label"
                >
                  {truncate(node.hca.label, 18)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* legend overlay */}
        {showLegend && (
          <div className="am-legend">
            the bigger a worry-bubble, the more it pushes on other worries. the
            glowing ones are where things start.
            <button
              className="am-legend-dismiss"
              onClick={() => setShowLegend(false)}
            >
              got it
            </button>
          </div>
        )}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: "var(--space-sm)", padding: "var(--space-md)" }}>
        <button className="am-btn am-btn-ghost" onClick={onBack}>
          ← back
        </button>
        <button className="am-btn am-btn-primary" onClick={onFocus}>
          where to start →
        </button>
      </div>
    </div>
  );
}

/* ── node shape renderer ─────────────────────────────────────── */

function NodeShape({
  shape,
  x,
  y,
  r,
  fill,
}: {
  shape: HCA["shape"];
  x: number;
  y: number;
  r: number;
  fill: string;
}) {
  switch (shape) {
    case "square":
      return (
        <rect
          x={x - r * 0.8}
          y={y - r * 0.8}
          width={r * 1.6}
          height={r * 1.6}
          rx={4}
          fill={fill}
          opacity={0.85}
        />
      );
    case "diamond":
      return (
        <rect
          x={x - r * 0.7}
          y={y - r * 0.7}
          width={r * 1.4}
          height={r * 1.4}
          rx={3}
          fill={fill}
          opacity={0.85}
          transform={`rotate(45 ${x} ${y})`}
        />
      );
    case "triangle": {
      const h = r * 1.6;
      const pts = [
        `${x},${y - r}`,
        `${x - h / 2},${y + r * 0.6}`,
        `${x + h / 2},${y + r * 0.6}`,
      ].join(" ");
      return <polygon points={pts} fill={fill} opacity={0.85} />;
    }
    case "hexagon": {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
      }).join(" ");
      return <polygon points={pts} fill={fill} opacity={0.85} />;
    }
    case "star": {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.5;
        return `${x + rad * Math.cos(angle)},${y + rad * Math.sin(angle)}`;
      }).join(" ");
      return <polygon points={pts} fill={fill} opacity={0.85} />;
    }
    default:
      return <circle cx={x} cy={y} r={r} fill={fill} opacity={0.85} />;
  }
}

/* ══════════════════════════════════════════════════════════════════
   phase 4: focus — "where to start"
   ══════════════════════════════════════════════════════════════════ */

function FocusPhase({
  state,
  dispatch,
  onBack,
  reducedMotion,
}: {
  state: MapSession;
  dispatch: React.Dispatch<MapAction>;
  onBack: () => void;
  reducedMotion: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 280 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setDims({
        w: entry.contentRect.width,
        h: Math.min(300, entry.contentRect.height),
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const edges = useMemo(() => computeEdges(state.ratings), [state.ratings]);
  const nodes = useMemo(
    () => computeNodes(state.hcas, edges, dims.w, dims.h),
    [state.hcas, edges, dims.w, dims.h],
  );
  const focusIds = useMemo(() => selectFocusNodes(nodes), [nodes]);
  const focusNodes = nodes.filter((n) => focusIds.includes(n.hca.id));

  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of nodes) m.set(n.hca.id, { x: n.x, y: n.y });
    return m;
  }, [nodes]);

  const exportPNG = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dims.w * 2;
      canvas.height = dims.h * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#273248";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `anxiety-map${state.childName ? `-${state.childName}` : ""}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [dims, state.childName]);

  return (
    <div className="am-phase" role="region" aria-label="where to start">
      <div className="am-title">where to start</div>
      <div className="am-subtitle">
        {focusNodes.length === 1
          ? "this worry drives the most others. easing it may create a cascade of relief."
          : `these ${focusNodes.length} worries drive the most others. start here.`}
      </div>

      <div className="am-focus-wrap">
        {/* mini graph with dimmed non-focus nodes */}
        <div
          ref={containerRef}
          style={{ width: "100%", maxWidth: 600, height: 280, flexShrink: 0 }}
        >
          <svg
            ref={svgRef}
            className="am-graph-svg"
            viewBox={`0 0 ${dims.w} ${dims.h}`}
            role="img"
            aria-label={`focus view: ${focusNodes.map((n) => n.hca.label).join(", ")}`}
          >
            <defs>
              {edges.map((edge) => {
                const src = posMap.get(edge.sourceId);
                const tgt = posMap.get(edge.targetId);
                if (!src || !tgt) return null;
                const srcNode = nodes.find((n) => n.hca.id === edge.sourceId);
                return (
                  <linearGradient
                    key={`fg-${edge.sourceId}-${edge.targetId}`}
                    id={`fg-${edge.sourceId}-${edge.targetId}`}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={srcNode?.hca.color ?? "#fff"} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={srcNode?.hca.color ?? "#fff"} stopOpacity={0.05} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* edges — dimmed unless connected to focus */}
            {edges.map((edge) => {
              const src = posMap.get(edge.sourceId);
              const tgt = posMap.get(edge.targetId);
              if (!src || !tgt) return null;
              const connected =
                focusIds.includes(edge.sourceId) ||
                focusIds.includes(edge.targetId);
              return (
                <path
                  key={`fe-${edge.sourceId}-${edge.targetId}`}
                  className="am-graph-edge"
                  d={edgePath(src.x, src.y, tgt.x, tgt.y)}
                  stroke={`url(#fg-${edge.sourceId}-${edge.targetId})`}
                  strokeWidth={1 + edge.strength * 1.5}
                  opacity={connected ? 0.8 : 0.08}
                />
              );
            })}

            {/* nodes */}
            {nodes.map((node) => {
              const r = nodeRadius(node.centrality);
              const isFocus = focusIds.includes(node.hca.id);
              return (
                <g key={node.hca.id} opacity={isFocus ? 1 : 0.15}>
                  {isFocus && !reducedMotion && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 8}
                      fill="none"
                      stroke={node.hca.color}
                      strokeWidth={3}
                      className="am-glow-ring"
                    />
                  )}
                  {isFocus && reducedMotion && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 8}
                      fill="none"
                      stroke={node.hca.color}
                      strokeWidth={3}
                      opacity={0.5}
                    />
                  )}
                  <NodeShape
                    shape={node.hca.shape}
                    x={node.x}
                    y={node.y}
                    r={r}
                    fill={node.hca.color}
                  />
                  <text
                    x={node.x}
                    y={node.y + r + 14}
                    className="am-graph-node-label"
                    opacity={isFocus ? 1 : 0.3}
                  >
                    {truncate(node.hca.label, 18)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* focus cards */}
        <div className="am-focus-cards">
          {focusNodes.map((node) => {
            const connected = getConnectedLabels(
              node.hca.id,
              edges,
              state.hcas,
            );
            return (
              <div key={node.hca.id} className="am-focus-card">
                <div className="am-focus-card-label">
                  <span
                    className="am-chip-dot"
                    style={{ background: node.hca.color }}
                  />
                  {node.hca.label}
                </div>
                <div className="am-focus-card-stat">
                  this worry pushes on {connected.length} other{" "}
                  {connected.length === 1 ? "worry" : "worries"}
                </div>
                {connected.length > 0 && (
                  <div className="am-focus-card-cascade">
                    if we can ease this one, it may help with{" "}
                    {connected.slice(0, 4).join(", ")}
                    {connected.length > 4 && `, and ${connected.length - 4} more`}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* actions */}
        <div className="am-focus-actions">
          <button className="am-btn am-btn-ghost" onClick={onBack}>
            ← back to map
          </button>
          <button className="am-btn am-btn-secondary" onClick={exportPNG}>
            save as image
          </button>
          <button
            className="am-btn am-btn-ghost"
            onClick={() => dispatch({ type: "RESET" })}
          >
            start fresh
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── utils ────────────────────────────────────────────────────── */

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
