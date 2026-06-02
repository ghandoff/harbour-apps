"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useParty } from "@/lib/use-party";
import { FacilitatorDashboard } from "@/components/facilitator-dashboard";
import { GAME_REGISTRY } from "@/lib/games";
import type { AgeLevel, DisplayMode } from "@/lib/types";

export default function FacilitatorLivePage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);
  const { state, connected, send } = useParty({
    roomCode: code,
    role: "facilitator",
  });

  // On first connect for a fresh room, derive the session config from the URL
  // query params and push it via the `setup` WS message. The activities are
  // looked up from GAME_REGISTRY[gameName]() — deterministic given the seed,
  // so the URL only carries (game name, age level, display mode), not the
  // 50KB Activity[] payload. This replaces the previous sessionStorage
  // handoff that broke any time the facilitator URL was opened on a
  // different device, tab, or browser session.
  //
  // If state.activities is already populated (room previously set up,
  // facilitator returning), we skip — the DO has the state, the URL params
  // are advisory only on first launch.
  useEffect(() => {
    if (!connected || initialized || !state) return;

    if (state.activities.length === 0) {
      // Strictly validate URL params before pushing into DO state — a
      // malformed `?age=garbage` would otherwise propagate as the room's
      // ageLevel until a facilitator command overwrites it.
      const VALID_AGE_LEVELS: readonly AgeLevel[] = ["kids", "highschool", "professional"];
      const VALID_DISPLAY_MODES: readonly DisplayMode[] = ["shared-screen", "screenless"];
      const rawAge = searchParams.get("age");
      const rawDisplay = searchParams.get("display");
      const age = rawAge && (VALID_AGE_LEVELS as readonly string[]).includes(rawAge)
        ? (rawAge as AgeLevel)
        : undefined;
      const display = rawDisplay && (VALID_DISPLAY_MODES as readonly string[]).includes(rawDisplay)
        ? (rawDisplay as DisplayMode)
        : undefined;

      const game = searchParams.get("game");
      let activities = game ? GAME_REGISTRY[game]?.() ?? [] : [];

      // Transitional fallback: if this facilitator opened the session in an
      // earlier build that stashed activities in sessionStorage, honour that
      // entry instead. Remove this branch once the previous build is fully
      // off the field (a few weeks after deploy).
      if (activities.length === 0) {
        try {
          const stored = sessionStorage.getItem(`raft:${code}`);
          if (stored) {
            const config = JSON.parse(stored) as { activities?: unknown };
            if (Array.isArray(config.activities) && config.activities.length > 0) {
              // Trust the legacy stash — it was built by an earlier version
              // of this same app, so the shape matches Activity[] by
              // construction.
              activities = config.activities as ReturnType<typeof GAME_REGISTRY[string]>;
            }
          }
        } catch {
          /* sessionStorage unavailable or JSON malformed — ignore */
        }
      }

      if (activities.length > 0) {
        send({
          type: "setup" as const,
          activities,
          ageLevel: age,
          displayMode: display,
        });
      }
    }
    setInitialized(true);
  }, [connected, initialized, state, code, send, searchParams]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">connecting...</p>
          <p className="text-sm text-[var(--rh-text-muted)]">
            room {code}
          </p>
        </div>
      </div>
    );
  }

  return <FacilitatorDashboard state={state} send={send} connected={connected} />;
}
