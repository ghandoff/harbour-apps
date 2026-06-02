"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateRoomCode } from "@/lib/room-code";
// Single source of truth for the catalogue lives in lib/games/index.ts.
// GAMES carries metadata + factory; GAME_REGISTRY is derived from GAMES;
// the Energy / Social / GameDescriptor types are re-exported from there
// so this page and the catalogue cannot drift. See lib/games/index.ts
// for the failure modes that drift used to produce.
import {
  GAMES,
  GAME_REGISTRY,
  type GameDescriptor,
  type Energy,
  type Social,
} from "@/lib/games";
import type { AgeLevel, DisplayMode } from "@/lib/types";
import "./discover.css";

// Local alias kept so the rest of the file's `Game` type references read
// the same as before. New code should import GameDescriptor directly.
type Game = GameDescriptor;


const DISC_COLORS: Record<string, string> = {
  mathematics: "#d97706",
  cs: "#3b82f6",
  physics: "#6366f1",
  biology: "#22c55e",
  chemistry: "#9333ea",
  economics: "#dc2626",
  psychology: "#ec4899",
  philosophy: "#8b5cf6",
  music: "#f97316",
  "visual-arts": "#0d9488",
  writing: "#6366f1",
};

const DISC_LABELS: Record<string, string> = {
  mathematics: "mathematics",
  cs: "computer science",
  physics: "physics",
  biology: "biology",
  chemistry: "chemistry",
  economics: "economics",
  psychology: "psychology",
  philosophy: "philosophy",
  music: "music",
  "visual-arts": "visual arts",
  writing: "writing",
};

const DISC_LIST = [
  "mathematics",
  "cs",
  "physics",
  "biology",
  "chemistry",
  "economics",
  "psychology",
  "philosophy",
  "music",
  "visual-arts",
  "writing",
];

const CLUSTERS: Record<
  string,
  {
    cx: number;
    cy: number;
    color: string;
    bg: string;
    shore: string;
    size: number;
  }
> = {
  mathematics: {
    cx: 350,
    cy: 250,
    color: "#d97706",
    bg: "#7a5a20",
    shore: "#a8842e",
    size: 130,
  },
  cs: {
    cx: 950,
    cy: 220,
    color: "#3b82f6",
    bg: "#2a4a3a",
    shore: "#3d6b52",
    size: 140,
  },
  physics: {
    cx: 200,
    cy: 620,
    color: "#6366f1",
    bg: "#4a3d28",
    shore: "#6b5a3a",
    size: 140,
  },
  biology: {
    cx: 780,
    cy: 530,
    color: "#22c55e",
    bg: "#2d5a25",
    shore: "#4a8a3a",
    size: 120,
  },
  chemistry: {
    cx: 1300,
    cy: 400,
    color: "#9333ea",
    bg: "#3a3040",
    shore: "#5a4a60",
    size: 110,
  },
  economics: {
    cx: 480,
    cy: 950,
    color: "#dc2626",
    bg: "#5a3020",
    shore: "#8a5030",
    size: 140,
  },
  psychology: {
    cx: 1100,
    cy: 780,
    color: "#ec4899",
    bg: "#4a2838",
    shore: "#6b3a50",
    size: 120,
  },
  philosophy: {
    cx: 300,
    cy: 1280,
    color: "#8b5cf6",
    bg: "#3a3548",
    shore: "#5a5060",
    size: 120,
  },
  music: {
    cx: 850,
    cy: 1100,
    color: "#f97316",
    bg: "#5a3a1a",
    shore: "#8a6030",
    size: 120,
  },
  "visual-arts": {
    cx: 1250,
    cy: 1150,
    color: "#0d9488",
    bg: "#1a4a40",
    shore: "#2a6a58",
    size: 110,
  },
  writing: {
    cx: 550,
    cy: 1500,
    color: "#6366f1",
    bg: "#3a3848",
    shore: "#5a5560",
    size: 110,
  },
};

const BLOBS = [
  "42% 58% 55% 45% / 48% 40% 60% 52%",
  "55% 45% 40% 60% / 52% 55% 45% 48%",
  "48% 52% 58% 42% / 45% 48% 52% 55%",
  "60% 40% 45% 55% / 42% 58% 42% 58%",
  "45% 55% 52% 48% / 55% 42% 58% 42%",
  "52% 48% 42% 58% / 58% 45% 55% 45%",
  "38% 62% 50% 50% / 50% 38% 62% 50%",
  "62% 38% 48% 52% / 40% 55% 45% 55%",
  "50% 50% 42% 58% / 58% 42% 52% 48%",
  "44% 56% 60% 40% / 50% 44% 56% 50%",
  "58% 42% 44% 56% / 46% 52% 48% 52%",
];

// ── helpers ────────────────────────────────────────────────────────────────

function mixColor(c1: string, c2: string, t: number): string {
  const hex2rgb = (h: string) => {
    const v = h.replace("#", "");
    return [
      parseInt(v.substring(0, 2), 16),
      parseInt(v.substring(2, 4), 16),
      parseInt(v.substring(4, 6), 16),
    ];
  };
  const a = hex2rgb(c1),
    b = hex2rgb(c2);
  const r = Math.round(a[0] * (1 - t) + b[0] * t);
  const g = Math.round(a[1] * (1 - t) + b[1] * t);
  const bl = Math.round(a[2] * (1 - t) + b[2] * t);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

function shuffle<T>(arr: T[]): T[] {
  const b = arr.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ── SVG icons ──────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="check-svg"
      viewBox="0 0 12 12"
      fill="none"
      stroke="white"
      strokeWidth="2"
    >
      <path d="M2 6l3 3 5-5" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function JoinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"
      />
    </svg>
  );
}

// ── wave lines ─────────────────────────────────────────────────────────────

const WAVE_LINES = Array.from({ length: 8 }, (_, i) => ({
  top: `${20 + i * 10}%`,
  dur: `${14 + Math.random() * 10}s`,
  delay: `${-Math.random() * 10}s`,
  opacity: 0.3 + Math.random() * 0.5,
}));

// ── component ──────────────────────────────────────────────────────────────

type Screen = "welcome" | "q1" | "q2" | "q3" | "thinking" | "results";
type Mode = "discover" | "browse";

export default function DiscoverPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("discover");
  const [screen, setScreen] = useState<Screen>("welcome");
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [social, setSocial] = useState<Social | null>(null);
  const [disc, setDisc] = useState<string | null>(null);
  const [detailGame, setDetailGame] = useState<Game | null>(null);
  const [sessionAgeLevel, setSessionAgeLevel] = useState<AgeLevel>("professional");
  const [sessionDisplayMode, setSessionDisplayMode] = useState<DisplayMode>("screenless");
  const [results, setResults] = useState<{
    matches: Game[];
    wildcard: Game;
    surprise: boolean;
  } | null>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // pan/zoom state
  const mapRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const mapState = useRef({
    x: 0,
    y: 0,
    scale: 0.8,
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastDist: 0,
    startX: 0,
    startY: 0,
    // touch gesture tracking
    touches: 0,
    pinching: false,
  });

  // ── screen transitions ──

  const screenClass = useCallback(
    (id: Screen) => {
      if (id === screen) return "screen s-active";
      const screens: Screen[] = [
        "welcome",
        "q1",
        "q2",
        "q3",
        "thinking",
        "results",
      ];
      const cur = screens.indexOf(screen);
      const target = screens.indexOf(id);
      return target < cur ? "screen s-hidden-left" : "screen s-hidden-right";
    },
    [screen],
  );

  const goTo = useCallback(
    (next: Screen) => {
      setScreenHistory((h) => [...h, screen]);
      setScreen(next);
    },
    [screen],
  );

  const goBack = useCallback(() => {
    setScreenHistory((h) => {
      const copy = [...h];
      const prev = copy.pop();
      if (prev) setScreen(prev);
      return copy;
    });
  }, []);

  const isQuestionScreen = ["q1", "q2", "q3"].includes(screen);

  // ── serendipity flow ──

  const selectEnergy = useCallback(
    (v: Energy) => {
      setEnergy(v);
      setTimeout(() => goTo("q2"), 420);
    },
    [goTo],
  );

  const selectSocial = useCallback(
    (v: Social) => {
      setSocial(v);
      setTimeout(() => goTo("q3"), 420);
    },
    [goTo],
  );

  const computeResults = useCallback(
    (surprise: boolean) => {
      let matches: Game[];
      let wildcard: Game;

      if (surprise) {
        const s = shuffle(GAMES);
        matches = s.slice(0, 3);
        wildcard = s[3];
      } else {
        let pool = GAMES.filter(
          (g) =>
            (!energy || g.energy === energy) &&
            (!social || g.social === social) &&
            (!disc || g.disc === disc),
        );
        if (pool.length < 3)
          pool = GAMES.filter(
            (g) =>
              (!energy || g.energy === energy) &&
              (!social || g.social === social),
          );
        if (pool.length < 3)
          pool = GAMES.filter((g) => !energy || g.energy === energy);
        if (pool.length < 3) pool = GAMES.slice();

        const s = shuffle(pool);
        matches = s.slice(0, 3);
        const matchNames = new Set(matches.map((g) => g.name));
        const remaining = GAMES.filter((g) => !matchNames.has(g.name));
        wildcard = remaining[Math.floor(Math.random() * remaining.length)];
      }

      setResults({ matches, wildcard, surprise });
      setVisibleCards(new Set());

      // stagger card reveal
      setTimeout(() => {
        [0, 1, 2, 3].forEach((i) => {
          setTimeout(
            () => setVisibleCards((s) => new Set([...s, i])),
            i * 120,
          );
        });
      }, 50);
    },
    [energy, social, disc],
  );

  const selectDisc = useCallback(
    (v: string | null) => {
      setDisc(v);
      setTimeout(() => {
        goTo("thinking");
        setTimeout(() => {
          computeResults(false);
          setScreenHistory((h) => [...h, "thinking"]);
          setScreen("results");
        }, 900);
      }, 400);
    },
    [goTo, computeResults],
  );

  const surpriseMe = useCallback(() => {
    setEnergy(null);
    setSocial(null);
    setDisc(null);
    goTo("thinking");
    setTimeout(() => {
      computeResults(true);
      setScreenHistory((h) => [...h, "thinking"]);
      setScreen("results");
    }, 900);
  }, [goTo, computeResults]);

  const tryAgain = useCallback(() => {
    setEnergy(null);
    setSocial(null);
    setDisc(null);
    setScreenHistory([]);
    setScreen("q1");
  }, []);

  // ── archipelago data ──

  const gamesByDisc = useMemo(() => {
    const groups: Record<string, Game[]> = {};
    GAMES.forEach((g) => {
      if (!groups[g.disc]) groups[g.disc] = [];
      groups[g.disc].push(g);
    });
    return groups;
  }, []);

  // ── pan/zoom ──

  const applyTransform = useCallback(() => {
    if (!mapRef.current) return;
    const { x, y, scale } = mapState.current;
    mapRef.current.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  }, []);

  useEffect(() => {
    // center map on mount
    const vw = window.innerWidth;
    mapState.current.x = vw / 2 - 700 * mapState.current.scale;
    mapState.current.y = -50;
    applyTransform();
  }, [applyTransform]);

  useEffect(() => {
    const el = archRef.current;
    if (!el) return;
    const ms = mapState.current;

    // ── mouse / pointer (desktop only) ──────────────────────────
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // handled by touch events
      if ((e.target as HTMLElement).closest(".fchip")) return;
      if ((e.target as HTMLElement).closest(".raft")) return;
      ms.dragging = true;
      ms.startX = e.clientX;
      ms.startY = e.clientY;
      ms.lastX = e.clientX;
      ms.lastY = e.clientY;
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!ms.dragging) return;
      ms.x += e.clientX - ms.lastX;
      ms.y += e.clientY - ms.lastY;
      ms.lastX = e.clientX;
      ms.lastY = e.clientY;
      applyTransform();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ms.dragging = false;
      el.classList.remove("dragging");
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const ns = Math.max(0.3, Math.min(2, ms.scale * delta));
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      ms.x = mx - (mx - ms.x) * (ns / ms.scale);
      ms.y = my - (my - ms.y) * (ns / ms.scale);
      ms.scale = ns;
      applyTransform();
    };

    // ── touch (mobile) ──────────────────────────────────────────
    // unified handler: 1 finger = pan, 2 fingers = pinch-zoom + pan
    const onTouchStart = (e: TouchEvent) => {
      ms.touches = e.touches.length;
      if (e.touches.length === 1) {
        if ((e.target as HTMLElement).closest(".fchip")) return;
        if ((e.target as HTMLElement).closest(".raft")) return;
        ms.dragging = true;
        ms.pinching = false;
        ms.lastX = e.touches[0].clientX;
        ms.lastY = e.touches[0].clientY;
        ms.startX = ms.lastX;
        ms.startY = ms.lastY;
        el.classList.add("dragging");
      } else if (e.touches.length === 2) {
        // transition from pan to pinch — stop pan, start pinch
        ms.dragging = false;
        ms.pinching = true;
        ms.lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        ms.lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        ms.lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // prevent page scroll/bounce

      if (e.touches.length === 1 && ms.dragging) {
        // single-finger pan
        const dx = e.touches[0].clientX - ms.lastX;
        const dy = e.touches[0].clientY - ms.lastY;
        ms.x += dx;
        ms.y += dy;
        ms.lastX = e.touches[0].clientX;
        ms.lastY = e.touches[0].clientY;
        applyTransform();
      } else if (e.touches.length === 2 && ms.pinching) {
        // two-finger pinch-zoom + simultaneous pan
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // zoom around pinch center
        if (ms.lastDist > 0) {
          const d = dist / ms.lastDist;
          const ns = Math.max(0.3, Math.min(2, ms.scale * d));
          const rect = el.getBoundingClientRect();
          const ox = cx - rect.left;
          const oy = cy - rect.top;
          ms.x = ox - (ox - ms.x) * (ns / ms.scale);
          ms.y = oy - (oy - ms.y) * (ns / ms.scale);
          ms.scale = ns;
        }

        // pan with pinch center movement
        ms.x += cx - ms.lastX;
        ms.y += cy - ms.lastY;

        ms.lastDist = dist;
        ms.lastX = cx;
        ms.lastY = cy;
        applyTransform();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      ms.touches = e.touches.length;
      if (e.touches.length === 0) {
        ms.dragging = false;
        ms.pinching = false;
        ms.lastDist = 0;
        el.classList.remove("dragging");
      } else if (e.touches.length === 1 && ms.pinching) {
        // went from 2 fingers to 1 — resume pan from current finger
        ms.pinching = false;
        ms.dragging = true;
        ms.lastX = e.touches[0].clientX;
        ms.lastY = e.touches[0].clientY;
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [applyTransform]);

  // center on filtered island
  const filterArch = useCallback(
    (id: string | null) => {
      setActiveFilter(id);
      if (id && CLUSTERS[id]) {
        const cl = CLUSTERS[id];
        const vw = window.innerWidth,
          vh = window.innerHeight;
        const ms = mapState.current;
        ms.x = vw / 2 - cl.cx * ms.scale;
        ms.y = vh / 2 - cl.cy * ms.scale;
        applyTransform();
      }
    },
    [applyTransform],
  );

  // ── render helpers ──

  const resultsSub = results?.surprise
    ? "a fresh deal \u2014 no questions asked"
    : [
        energy,
        social,
        disc ? DISC_LABELS[disc] || disc : null,
      ]
        .filter(Boolean)
        .join(" \u00B7 ") || "your perfect match";

  return (
    <>
      {/* water background */}
      <div className="discover-water" />
      <div className="discover-water-shine" />
      {WAVE_LINES.map((w, i) => (
        <div
          key={i}
          className="discover-wave-line"
          style={
            {
              top: w.top,
              "--dur": w.dur,
              animationDelay: w.delay,
              opacity: w.opacity,
            } as React.CSSProperties
          }
        />
      ))}

      <div className="discover-app">
        {/* ═══ SERENDIPITY ═══ */}
        <div
          className={`mode-view serendipity ${mode === "discover" ? "active" : "hidden-left"}`}
        >
          {/* progress dots */}
          <div
            className={`progress-bar ${isQuestionScreen ? "" : "hidden"}`}
          >
            {[0, 1, 2].map((i) => {
              const qIdx = ["q1", "q2", "q3"].indexOf(screen);
              let cls = "pdot";
              if (i < qIdx) cls += " done";
              else if (i === qIdx) cls += " active";
              return <div key={i} className={cls} />;
            })}
          </div>

          {/* back button */}
          <button
            className={`back-nav ${isQuestionScreen ? "" : "hidden"}`}
            onClick={goBack}
          >
            <BackIcon /> back
          </button>

          {/* welcome */}
          <div className={screenClass("welcome")}>
            <div className="welcome-brand">
              {"\u{1F6F6}"} raft.house
            </div>
            <h1 className="welcome-heading">
              what are you in
              <br />
              the mood for?
            </h1>
            <p className="welcome-sub">
              answer 3 quick questions and we&apos;ll find your perfect
              session
            </p>
            <div className="welcome-actions">
              <button
                className="btn btn-primary"
                onClick={() => goTo("q1")}
              >
                let&apos;s go <ArrowIcon />
              </button>
              <button
                className="btn btn-outline"
                onClick={surpriseMe}
              >
                {"\u{1F3B2}"} surprise me
              </button>
            </div>
          </div>

          {/* Q1: energy */}
          <div className={screenClass("q1")}>
            <div className="question-screen">
              <div className="question-label">question 1 of 3</div>
              <h2 className="question-heading">
                how much energy does your group have?
              </h2>
              <div className="option-cards">
                {(
                  [
                    {
                      emoji: "\u{1F30A}",
                      label: "contemplative",
                      desc: "we want to think deeply",
                      value: "contemplative" as Energy,
                    },
                    {
                      emoji: "\u26A1",
                      label: "energized",
                      desc: "we're ready to compete",
                      value: "energized" as Energy,
                    },
                    {
                      emoji: "\u{1F3AD}",
                      label: "playful",
                      desc: "we want to explore and create",
                      value: "playful" as Energy,
                    },
                  ] as const
                ).map((opt) => (
                  <div
                    key={opt.value}
                    className={`option-card ${energy === opt.value ? "selected" : ""}`}
                    onClick={() => selectEnergy(opt.value)}
                  >
                    <div className="option-emoji">{opt.emoji}</div>
                    <div className="option-content">
                      <span className="option-label">
                        {opt.label}
                      </span>
                      <span className="option-desc">{opt.desc}</span>
                    </div>
                    <div className="option-check">
                      <CheckIcon />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Q2: social */}
          <div className={screenClass("q2")}>
            <div className="question-screen">
              <div className="question-label">question 2 of 3</div>
              <h2 className="question-heading">
                how will your group work?
              </h2>
              <div className="option-cards">
                {(
                  [
                    {
                      emoji: "\u{1F464}",
                      label: "solo",
                      desc: "everyone works independently",
                      value: "solo" as Social,
                    },
                    {
                      emoji: "\u{1F91D}",
                      label: "collaborative",
                      desc: "we'll work together",
                      value: "collaborative" as Social,
                    },
                    {
                      emoji: "\u{1F9E9}",
                      label: "asymmetric",
                      desc: "different roles, different info",
                      value: "asymmetric" as Social,
                    },
                  ] as const
                ).map((opt) => (
                  <div
                    key={opt.value}
                    className={`option-card ${social === opt.value ? "selected" : ""}`}
                    onClick={() => selectSocial(opt.value)}
                  >
                    <div className="option-emoji">{opt.emoji}</div>
                    <div className="option-content">
                      <span className="option-label">
                        {opt.label}
                      </span>
                      <span className="option-desc">{opt.desc}</span>
                    </div>
                    <div className="option-check">
                      <CheckIcon />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Q3: discipline */}
          <div className={screenClass("q3")}>
            <div className="question-screen">
              <div className="question-label">question 3 of 3</div>
              <h2 className="question-heading">
                what world do you want to explore?
              </h2>
              <div className="disc-scroll">
                <div className="disc-grid">
                  <div
                    className={`disc-pill disc-pill-anything ${disc === null && screen === "q3" ? "" : ""}`}
                    style={
                      { "--disc-color": "#17858a" } as React.CSSProperties
                    }
                    onClick={() => selectDisc(null)}
                  >
                    <div className="disc-dot" />
                    <span className="disc-name">
                      anything {"\u2726"}
                    </span>
                  </div>
                  {DISC_LIST.map((id) => (
                    <div
                      key={id}
                      className={`disc-pill ${disc === id ? "selected" : ""}`}
                      style={
                        {
                          "--disc-color":
                            DISC_COLORS[id] || "#17858a",
                        } as React.CSSProperties
                      }
                      onClick={() => selectDisc(id)}
                    >
                      <div className="disc-dot" />
                      <span className="disc-name">
                        {DISC_LABELS[id]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* thinking */}
          <div className={screenClass("thinking")}>
            <div className="thinking-screen">
              <div className="thinking-dots">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
              <div className="thinking-text">
                finding your games...
              </div>
            </div>
          </div>

          {/* results */}
          <div className={screenClass("results")}>
            <div className="results-screen">
              <div className="results-scroll">
                <div className="results-heading">
                  we found your games
                </div>
                <div className="results-sub">{resultsSub}</div>
                <div className="results-section-label">
                  your matches
                </div>
                <div className="game-cards">
                  {results?.matches.map((g, i) => (
                    <GameCard
                      key={g.name}
                      game={g}
                      wildcard={false}
                      visible={visibleCards.has(i)}
                      onOpen={setDetailGame}
                    />
                  ))}
                </div>
                <div className="results-section-label">
                  {"\u{1F3B2}"} wildcard
                </div>
                <div className="game-cards">
                  {results?.wildcard && (
                    <GameCard
                      game={results.wildcard}
                      wildcard
                      visible={visibleCards.has(3)}
                      onOpen={setDetailGame}
                    />
                  )}
                </div>
              </div>
              <div className="results-footer">
                <button
                  className="btn btn-outline try-again-btn"
                  onClick={tryAgain}
                >
                  not feeling it? try again
                </button>
                <button
                  className="random-link"
                  onClick={surpriseMe}
                >
                  deal me a random game
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ARCHIPELAGO ═══ */}
        <div
          ref={archRef}
          className={`mode-view archipelago ${mode === "browse" ? "active" : "hidden-right"}`}
        >
          {/* filter bar */}
          <div className="arch-filter-bar">
            <button
              className={`fchip ${activeFilter === null ? "active" : ""}`}
              onClick={() => filterArch(null)}
            >
              all
            </button>
            {DISC_LIST.map((id) => (
              <button
                key={id}
                className={`fchip ${activeFilter === id ? "active" : ""}`}
                onClick={() => filterArch(id)}
              >
                {DISC_LABELS[id]}
              </button>
            ))}
          </div>

          {/* map world */}
          <div ref={mapRef} className="map-world">
            {DISC_LIST.map((discId, discIdx) => {
              const games = gamesByDisc[discId];
              if (!games) return null;
              if (activeFilter && discId !== activeFilter) return null;

              const cluster = CLUSTERS[discId];
              const islandSize = cluster.size;
              const blobShape = BLOBS[discIdx % BLOBS.length];
              const n = games.length;
              const angleStart =
                ((discIdx * 137.5 * Math.PI) / 180) %
                (Math.PI * 2);
              const mooringRadius = islandSize / 2 + 40;

              return (
                <div key={discId}>
                  {/* the island */}
                  <div
                    className="map-island"
                    style={{
                      left: cluster.cx - islandSize / 2,
                      top: cluster.cy - islandSize / 2,
                      width: islandSize,
                      height: islandSize,
                    }}
                  >
                    {[0, 1, 2].map((r) => (
                      <div
                        key={r}
                        className="map-island-ripple"
                        style={{ borderRadius: blobShape }}
                      />
                    ))}
                    <div
                      className="map-island-shallows"
                      style={{ borderRadius: blobShape }}
                    />
                    <div
                      className="map-island-shore"
                      style={{ borderRadius: blobShape }}
                    />
                    <div
                      className="map-island-body"
                      style={{
                        borderRadius: blobShape,
                        background: `radial-gradient(ellipse 90% 80% at 38% 32%, ${mixColor(cluster.bg, "#8aad6a", 0.25)} 0%, ${mixColor(cluster.bg, "#5a7a3a", 0.15)} 30%, ${cluster.bg} 60%, ${mixColor(cluster.bg, "#1a2a1e", 0.5)} 100%)`,
                      }}
                    >
                      <div className="map-island-name">
                        {DISC_LABELS[discId]}
                      </div>
                    </div>
                  </div>

                  {/* mooring lines + rafts */}
                  {games.map((game, i) => {
                    const angle =
                      angleStart + (i / n) * Math.PI * 2;
                    const jitter = ((i % 3) - 1) * 12;
                    const rx =
                      cluster.cx +
                      Math.cos(angle) *
                        (mooringRadius + jitter);
                    const ry =
                      cluster.cy +
                      Math.sin(angle) *
                        (mooringRadius + jitter);

                    // mooring line endpoints
                    const x1 =
                      cluster.cx +
                      Math.cos(angle) * (islandSize / 2 - 5);
                    const y1 =
                      cluster.cy +
                      Math.sin(angle) * (islandSize / 2 - 5);
                    const minX = Math.min(x1, rx) - 5;
                    const minY = Math.min(y1, ry) - 5;
                    const maxX = Math.max(x1, rx) + 5;
                    const maxY = Math.max(y1, ry) + 5;
                    const w = maxX - minX;
                    const h = maxY - minY;

                    const mech = game.mechanics;
                    const bobDur = 3.5 + ((i * 7) % 25) / 10;
                    const bobDelay = -((i * 13) % 50) / 10;

                    return (
                      <div key={game.name}>
                        {/* mooring line */}
                        <svg
                          className="mooring-svg"
                          style={{
                            left: minX,
                            top: minY,
                            width: w,
                            height: h,
                          }}
                          viewBox={`0 0 ${w} ${h}`}
                          fill="none"
                        >
                          <line
                            x1={x1 - minX}
                            y1={y1 - minY}
                            x2={rx - minX}
                            y2={ry - minY}
                            stroke="rgba(160,130,80,0.25)"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                        </svg>

                        {/* raft */}
                        <div
                          className="raft"
                          style={{
                            left: rx - 28,
                            top: ry - 19,
                            ["--raft-accent" as string]:
                              cluster.shore,
                            animation: `bob ${bobDur}s ease-in-out ${bobDelay}s infinite`,
                          }}
                          onClick={() =>
                            setDetailGame(game)
                          }
                        >
                          <div className="raft-wake" />
                          <div className="raft-deck">
                            <span className="raft-icon">
                              {game.icon}
                            </span>
                          </div>
                          <div className="raft-label">
                            {game.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="compass">N</div>
        </div>
      </div>

      {/* ═══ MODE BAR ═══ */}
      <div className="mode-bar">
        <div className="mode-toggle">
          <button
            className={`mode-tab ${mode === "discover" ? "active" : ""}`}
            onClick={() => setMode("discover")}
          >
            <DiscoverIcon /> discover
          </button>
          <button
            className={`mode-tab ${mode === "browse" ? "active" : ""}`}
            onClick={() => setMode("browse")}
          >
            <GlobeIcon /> explore map
          </button>
          <Link
            href="/join"
            className="mode-tab"
          >
            <JoinIcon /> join session
          </Link>
        </div>
      </div>

      {/* ═══ DETAIL SHEET ═══ */}
      <div
        className={`detail-overlay ${detailGame ? "visible" : ""}`}
      >
        <div
          className="detail-backdrop"
          onClick={() => setDetailGame(null)}
        />
        {detailGame && (
          <div className="detail-sheet">
            <div className="detail-handle" />
            <div className="detail-icon">{detailGame.icon}</div>
            <div className="detail-name">{detailGame.name}</div>
            <div
              className="detail-disc"
              style={{
                color:
                  DISC_COLORS[detailGame.disc] || "#7dd3d8",
              }}
            >
              {DISC_LABELS[detailGame.disc] || detailGame.disc}
            </div>
            <div className="detail-desc">{detailGame.desc}</div>
            <div className="detail-tags">
              <span className="detail-tag">
                {detailGame.energy}
              </span>
              <span className="detail-tag">
                {detailGame.social}
              </span>
              <span
                className="detail-mechanic-tag"
                style={{
                  color: detailGame.mechanics.color,
                  borderColor: detailGame.mechanics.color + "44",
                  background: detailGame.mechanics.color + "18",
                }}
              >
                {detailGame.mechanics.verb}
              </span>
              <span className="detail-tag">{detailGame.mechanics.input}</span>
              <span className="detail-tag">{detailGame.mechanics.temporality}</span>
            </div>
            <div className="detail-mechanics">
              <div className="detail-mech-row">
                <span className="detail-mech-label">agency</span>
                <span className="detail-mech-value">{detailGame.mechanics.agency}</span>
              </div>
              <div className="detail-mech-row">
                <span className="detail-mech-label">loop</span>
                <span className="detail-mech-value">{detailGame.mechanics.coreLoop}</span>
              </div>
            </div>
            {/* ── session config ─────────────────── */}
            <div className="detail-config">
              <div className="detail-config-row">
                <span className="detail-config-label">play mode</span>
                <div className="detail-config-options">
                  <button
                    className={`detail-config-btn${sessionDisplayMode === "screenless" ? " active" : ""}`}
                    onClick={() => setSessionDisplayMode("screenless")}
                  >
                    📱 phones
                  </button>
                  <button
                    className={`detail-config-btn${sessionDisplayMode === "shared-screen" ? " active" : ""}`}
                    onClick={() => setSessionDisplayMode("shared-screen")}
                  >
                    🔥 campfire
                  </button>
                </div>
              </div>
              <div className="detail-config-row">
                <span className="detail-config-label">audience</span>
                <div className="detail-config-options">
                  <button
                    className={`detail-config-btn${sessionAgeLevel === "kids" ? " active" : ""}`}
                    onClick={() => setSessionAgeLevel("kids")}
                  >
                    🌱 kids
                  </button>
                  <button
                    className={`detail-config-btn${sessionAgeLevel === "highschool" ? " active" : ""}`}
                    onClick={() => setSessionAgeLevel("highschool")}
                  >
                    🌿 teens
                  </button>
                  <button
                    className={`detail-config-btn${sessionAgeLevel === "professional" ? " active" : ""}`}
                    onClick={() => setSessionAgeLevel("professional")}
                  >
                    🌳 pro
                  </button>
                </div>
              </div>
            </div>
            <button
              className="detail-play"
              onClick={() => {
                const code = generateRoomCode();
                // Session config travels in URL query params instead of
                // sessionStorage. The Activity[] is a deterministic function
                // of the game name (lib/games/index.ts → GAME_REGISTRY), so
                // only the SEED needs to flow through the URL — the
                // facilitator page rebuilds the activities client-side on
                // first connect. This makes the facilitator URL fully
                // shareable across devices, tabs, and incognito sessions,
                // which sessionStorage made impossible.
                const params = new URLSearchParams({
                  game: detailGame.name,
                  age: sessionAgeLevel,
                  display: sessionDisplayMode,
                });
                router.push(`/facilitate/live/${code}?${params}`);
              }}
            >
              start session <ArrowIcon />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── GameCard component ─────────────────────────────────────────────────────

function GameCard({
  game,
  wildcard,
  visible,
  onOpen,
}: {
  game: Game;
  wildcard: boolean;
  visible: boolean;
  onOpen: (g: Game) => void;
}) {
  const discColor = DISC_COLORS[game.disc] || "#7dd3d8";
  const mech = game.mechanics;

  return (
    <div
      className={`game-card ${wildcard ? "wildcard" : ""} ${visible ? "visible" : ""}`}
      onClick={() => onOpen(game)}
    >
      <div className="game-card-icon">{game.icon}</div>
      <div className="game-card-main">
        <div className="game-card-header">
          <span className="game-name">{game.name}</span>
          {wildcard ? (
            <span
              className="game-badge"
              style={{
                color: "#7dd3d8",
                borderColor: "rgba(125,211,216,0.3)",
                background: "rgba(125,211,216,0.1)",
              }}
            >
              {"\u{1F3B2}"} wildcard
            </span>
          ) : (
            <span
              className="game-badge"
              style={{
                color: discColor,
                borderColor: discColor + "44",
                background: discColor + "18",
              }}
            >
              {DISC_LABELS[game.disc] || game.disc}
            </span>
          )}
          <span
            className="game-mechanic-badge"
            style={{
              color: mech.color,
              borderColor: mech.color + "33",
              background: mech.color + "12",
            }}
          >
            {mech.verb}
          </span>
          <span className="game-mechanic-badge">
            {mech.temporality}
          </span>
        </div>
        <div className="game-desc">{game.desc}</div>
      </div>
      <button
        className="game-play-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(game);
        }}
      >
        <ArrowIcon />
      </button>
    </div>
  );
}
