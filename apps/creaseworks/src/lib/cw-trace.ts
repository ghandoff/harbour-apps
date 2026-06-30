/**
 * cw-trace — best-effort behavioural trace transport.
 *
 * logEvent() stamps the CURRENT identity (group/player/device/session) at
 * the moment of the call and queues it. The queue flushes:
 *   • when it fills (BATCH), or after a short debounce during active play
 *     → fetch(keepalive)
 *   • on pagehide / visibilitychange:hidden → navigator.sendBeacon (the
 *     only transport that reliably survives an unload)
 *
 * Same-host, root-relative POST to the eval worker (mirrors eval-submit) —
 * no CORS. Everything fails soft; a dropped trace is acceptable, a broken
 * play session is not. Minimal-core events only.
 */

import {
  getGroup,
  getSelectedPlayer,
  getDeviceToken,
  getSessionId,
} from "@/lib/cw-identity";

const EVENTS_URL = "/harbour/creaseworks-eval/api/eval/events";
const BATCH = 20;
const DEBOUNCE_MS = 4000;

export type TraceType = "session_start" | "stage_enter" | "activity_open";

interface QueuedEvent {
  event_type: TraceType;
  stage: string | null;
  activity: string | null;
  seq: number | null;
  group_code: string | null;
  player_id: string | null;
  device_token: string | null;
  session_id: string | null;
}

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listenersInstalled = false;

const hasWindow = () => typeof window !== "undefined";

function send(events: QueuedEvent[], useBeacon: boolean): void {
  if (events.length === 0) return;
  const payload = JSON.stringify({ events });
  try {
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(EVENTS_URL, blob);
      return;
    }
  } catch {
    // fall through to fetch
  }
  try {
    void fetch(EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** Flush the whole queue now. useBeacon for unload paths. */
export function flushTraces(useBeacon = false): void {
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
  const onHide = () => flushTraces(true);
  window.addEventListener("pagehide", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushTraces(true);
  });
}

export function logEvent(
  type: TraceType,
  opts: { stage?: string | null; activity?: string | null; seq?: number | null } = {},
): void {
  if (!hasWindow()) return;
  installListeners();

  const group = getGroup();
  const player = getSelectedPlayer();

  queue.push({
    event_type: type,
    stage: opts.stage ?? null,
    activity: opts.activity ?? null,
    seq: opts.seq ?? null,
    group_code: group?.code ?? null,
    player_id: player?.id ?? null,
    device_token: getDeviceToken(),
    session_id: getSessionId(),
  });

  if (queue.length >= BATCH) {
    flushTraces(false);
    return;
  }
  if (!timer) timer = setTimeout(() => flushTraces(false), DEBOUNCE_MS);
}
