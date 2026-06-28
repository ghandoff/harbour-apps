"use client";

/**
 * TraceProbe — the passive trace layer, mounted once in the mini shell.
 *
 * Responsibilities:
 *   • ensure device + session tokens exist
 *   • emit session_start once per session
 *   • emit stage_enter (with a monotonic seq) on every look/make/show/wow
 *     entry — the seq reconstructs the path order, even across reloads
 *   • prompt the "who's playing?" picker when a group roster exists but no
 *     player is selected this session (skippable → anonymous)
 *   • offer a tiny re-open chip so a shared tablet can switch players
 *
 * Renders no chrome of its own besides the picker + the chip. Everything
 * is best-effort and SSR-safe.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { miniStageFromPathname, MINI_STAGES } from "@/lib/mini-pilot";
import {
  getDeviceToken,
  getSessionId,
  getGroup,
  getSelectedPlayer,
  setSelectedPlayer,
  getLastPlayer,
  fetchRoster,
  type Player,
} from "@/lib/cw-identity";
import { logEvent, flushTraces } from "@/lib/cw-trace";
import { avatarEmoji, avatarHex } from "@/lib/cw-avatars";
import { PlayerPicker } from "./player-picker";

const STARTED_KEY = "cw-trace-started";
const SKIPPED_KEY = "cw-picker-skipped";
const SEQ_KEY = "cw-trace-seq";
const STAGE_KEYS = new Set<string>(MINI_STAGES.map((s) => s.key));

function nextSeq(): number {
  try {
    const n = parseInt(sessionStorage.getItem(SEQ_KEY) || "0", 10) + 1;
    sessionStorage.setItem(SEQ_KEY, String(n));
    return n;
  } catch {
    return 0;
  }
}

export function TraceProbe() {
  const pathname = usePathname();
  const lastStage = useRef<string | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);

  // once: device/session + session_start + roster check
  useEffect(() => {
    getDeviceToken();
    getSessionId();
    try {
      if (!sessionStorage.getItem(STARTED_KEY)) {
        logEvent("session_start");
        sessionStorage.setItem(STARTED_KEY, "1");
      }
    } catch {}

    setSelected(getSelectedPlayer());

    const group = getGroup();
    if (!group) return;
    let cancelled = false;
    void fetchRoster(group.code).then((r) => {
      if (cancelled) return;
      setRoster(r.players);
      // prompt only if there's a roster, nobody chosen yet, and not skipped
      let skipped = false;
      try {
        skipped = sessionStorage.getItem(SKIPPED_KEY) === "1";
      } catch {}
      if (r.players.length > 0 && !getSelectedPlayer() && !skipped) {
        setPickerOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // stage_enter on every stage change
  useEffect(() => {
    const stage = miniStageFromPathname(pathname);
    if (!stage || !STAGE_KEYS.has(stage)) return;
    if (lastStage.current === stage) return;
    lastStage.current = stage;
    logEvent("stage_enter", { stage, seq: nextSeq() });
    // a stage change is a natural flush point so traces land mid-session
    flushTraces(false);
  }, [pathname]);

  function pick(p: Player) {
    setSelectedPlayer(p);
    setSelected(p);
    setPickerOpen(false);
  }

  function skip() {
    try {
      sessionStorage.setItem(SKIPPED_KEY, "1");
    } catch {}
    setPickerOpen(false);
  }

  return (
    <>
      {pickerOpen && (
        <PlayerPicker
          players={roster}
          lastPlayerId={getLastPlayer()?.id ?? null}
          onPick={pick}
          onSkip={skip}
        />
      )}

      {/* re-open chip: shows who's playing + lets a shared tablet switch.
          only when a roster offers a real choice (>1) */}
      {!pickerOpen && roster.length > 1 && (
        <button
          type="button"
          className="cw-who-chip"
          onClick={() => setPickerOpen(true)}
          aria-label={selected ? "switch who's playing" : "choose who's playing"}
        >
          <style>{`
            .cw-who-chip {
              position: fixed; left: 14px; bottom: 14px; z-index: 40;
              display: inline-flex; align-items: center; gap: 7px;
              padding: 6px 12px 6px 7px;
              background: var(--wv-white);
              border: 1.5px solid rgba(39, 50, 72, 0.12);
              border-radius: 16px 20px 14px 18px;
              box-shadow: 0 3px 10px rgba(39, 50, 72, 0.18);
              cursor: pointer;
              font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
              font-weight: 800; font-size: 12px; color: var(--wv-cadet);
            }
            .cw-who-chip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
            .cw-who-face {
              width: 26px; height: 26px; border-radius: 9px 11px 8px 10px;
              display: inline-flex; align-items: center; justify-content: center;
              font-size: 16px; line-height: 1;
            }
          `}</style>
          <span
            className="cw-who-face"
            style={{ background: selected ? avatarHex(selected.avatar) : "rgba(39,50,72,0.08)" }}
            aria-hidden="true"
          >
            {selected ? avatarEmoji(selected.avatar) : "👤"}
          </span>
          {selected ? "playing" : "who's playing?"}
        </button>
      )}
    </>
  );
}
