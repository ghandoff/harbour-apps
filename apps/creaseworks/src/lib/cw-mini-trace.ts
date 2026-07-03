/**
 * cw-mini-trace — the mini's own behavioural trace ("stealth assessment").
 *
 * DELIBERATELY SEPARATE from cw-trace.ts (which is roster-keyed and posts
 * cross-host to the eval worker). This one is:
 *   • MINI-LOCAL — POSTs to /api/mini/trace on this same worker (so it works
 *     on a workers.dev preview canary, unlike the cross-host roster trace),
 *   • keyed to the FAMILY CODE only + a mini-local session id — it NEVER reads
 *     cw-identity's player/device, so no child identity can enter a payload,
 *   • best-effort: a dropped trace is fine, a broken play session is not.
 *
 * Nothing here (or downstream) is required for play to proceed, and no UI
 * renders a judgment derived from these events.
 */

import { apiUrl } from "@/lib/api-url";
import { loadCode } from "@/lib/mini-pilot";

export type MiniTraceType =
  | "material_picked"
  | "wants_to_do"
  | "job_assigned"
  | "scaffold_tap"
  | "phase_time"
  | "provocation_flip"
  | "ending_choice"
  | "guess_event";

const SESSION_KEY = "cw-mini-session";
const BATCH = 15;
const DEBOUNCE_MS = 4000;

interface QueuedMiniEvent {
  event_type: MiniTraceType;
  family_code: string | null;
  session_id: string | null;
  playdate_slug: string | null;
  payload: Record<string, unknown>;
}

let queue: QueuedMiniEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listenersInstalled = false;

const hasWindow = () => typeof window !== "undefined";

/** a per-tab session id — no identity, just groups one sitting's events. */
function miniSession(): string | null {
  if (!hasWindow()) return null;
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return null;
  }
}

function send(events: QueuedMiniEvent[], useBeacon: boolean): void {
  if (events.length === 0) return;
  const url = apiUrl("/api/mini/trace");
  const payload = JSON.stringify({ events });
  try {
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through to fetch
  }
  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** Flush the queue now. useBeacon on unload paths. */
export function flushMiniTraces(useBeacon = false): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  send(batch, useBeacon);
}

function installListeners(): void {
  if (listenersInstalled || !hasWindow()) return;
  listenersInstalled = true;
  window.addEventListener("pagehide", () => flushMiniTraces(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushMiniTraces(true);
  });
}

/**
 * Log one behavioural event. `opts.playdate_slug` is pulled out; everything
 * else in `opts` becomes the payload. Callers pass ONLY conditions/choices —
 * never a child name or player id.
 */
export function miniTrace(
  type: MiniTraceType,
  opts: { playdate_slug?: string | null } & Record<string, unknown> = {},
): void {
  if (!hasWindow()) return;
  installListeners();

  const { playdate_slug = null, ...payload } = opts;
  const code = loadCode();
  if (!code) return; // no family code → nothing to key to; skip silently

  queue.push({
    event_type: type,
    family_code: code,
    session_id: miniSession(),
    playdate_slug: playdate_slug ?? null,
    payload,
  });

  if (queue.length >= BATCH) {
    flushMiniTraces(false);
    return;
  }
  if (!timer) timer = setTimeout(() => flushMiniTraces(false), DEBOUNCE_MS);
}

/**
 * Emit one `material_picked` per gathered material, keyed to the find tool.
 * Shared by the tools that bypass FoundPicker (scavenger, nod-or-spin) and the
 * multi-round things game, so every look mode stamps the SAME event shape
 * FoundPicker's default path does ({ look_tool, material, loud_quiet }). Log the
 * final union once — never per round — to match the single-log semantics of the
 * classic/timer pickers and avoid inflating counts.
 */
export function traceMaterialsPicked(
  lookTool: string,
  materials: Array<{ title: string; loudQuiet?: "loud" | "quiet" }>,
): void {
  for (const m of materials) {
    miniTrace("material_picked", {
      look_tool: lookTool,
      material: m.title,
      loud_quiet: m.loudQuiet ?? null,
    });
  }
}
