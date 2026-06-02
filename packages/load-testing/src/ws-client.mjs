// PartyServer WebSocket client for Node — wraps `ws` with awaitable message
// helpers + a tagged-event log so scenarios can assert behaviour cleanly.
//
// Why not partysocket on the test side? partysocket is a reconnect-managed
// browser client. For tests we WANT to control connection lifecycle precisely
// (open → handshake → assert frame → maybe disconnect → reconnect → assert
// hydration). The bare `ws` client gives us that.

import WebSocket from "ws";

/**
 * @typedef {Object} ConnectOptions
 * @property {string} baseUrl  - e.g. "https://windedvertigo.com/harbour/raft-house"
 * @property {string} roomCode
 * @property {"facilitator" | "participant"} role
 * @property {string} [name]
 * @property {string} [participantRole]
 * @property {number} [openTimeoutMs=8000]
 */

/**
 * @typedef {Object} ServerFrame
 * @property {string} type
 * @property {any}    [state]
 * @property {string} [yourId]
 * @property {any}    [participant]
 * @property {string} [participantId]
 * @property {any}    [activity]
 * @property {number} [activityIndex]
 * @property {string} [hint]
 * @property {string} [activityId]
 * @property {Record<string, unknown>} [responses]
 * @property {any}    [timer]
 */

/**
 * Build the same-origin PartyServer URL the client at apps/raft-house/lib/use-party.ts
 * would build. Single source of truth — if the prefix or namespace changes,
 * change it here and the whole harness follows.
 */
export function buildPartyUrl({ baseUrl, roomCode, role, name, participantRole }) {
  const u = new URL(baseUrl);
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams({ role });
  if (name) params.set("name", name);
  if (participantRole) params.set("participantRole", participantRole);
  // basePath /harbour/raft-house is part of the prefix configured in worker.ts;
  // routePartykitRequest parses the trailing /:namespace/:room from this URL.
  const path = `${u.pathname.replace(/\/$/, "")}/parties/raft-room/${encodeURIComponent(roomCode)}`;
  return `${proto}//${u.host}${path}?${params}`;
}

/**
 * Open a connection, return a tiny driver. The driver buffers every message it
 * receives in `frames` (FIFO) so scenarios can assert post-hoc, AND exposes
 * `waitFor(predicate, ms)` for ordered assertions.
 *
 * @param {ConnectOptions} opts
 */
export async function connect(opts) {
  const url = buildPartyUrl(opts);
  const ws = new WebSocket(url, { handshakeTimeout: opts.openTimeoutMs ?? 8000 });

  /** @type {ServerFrame[]} */
  const frames = [];
  /** @type {Array<(f: ServerFrame) => void>} */
  const waiters = [];
  let openResolved = false;
  let closed = false;
  /** @type {Error | null} */
  let lastError = null;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      frames.push(msg);
      // Drain pending waiters in arrival order — first match wins.
      for (let i = 0; i < waiters.length; i++) {
        try {
          waiters[i](msg);
        } catch {
          /* ignore — waiter set its own state */
        }
      }
    } catch (e) {
      // Drop non-JSON frames; raft-house only ever sends JSON.
      lastError = /** @type {Error} */ (e);
    }
  });

  ws.on("close", () => {
    closed = true;
  });

  ws.on("error", (e) => {
    lastError = e;
  });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`open timeout for ${url}`)), opts.openTimeoutMs ?? 8000);
    ws.once("open", () => {
      clearTimeout(t);
      openResolved = true;
      resolve(undefined);
    });
    ws.once("unexpected-response", (_req, res) => {
      clearTimeout(t);
      reject(new Error(`handshake failed: HTTP ${res.statusCode} for ${url}`));
    });
    ws.once("error", (e) => {
      if (!openResolved) {
        clearTimeout(t);
        reject(e);
      }
    });
  });

  /**
   * Send a client message. The server-side reducer expects
   *   { role: "facilitator", ...payload }     for facilitator commands
   *   { role: "participant", participantId, ...payload }     for participant commands
   * The participantId field is ignored by the server (it uses sender.id),
   * but the type guard in handleParticipant requires the property to exist.
   */
  function send(msg) {
    const wire =
      opts.role === "facilitator"
        ? { ...msg, role: "facilitator" }
        : { ...msg, role: "participant", participantId: "" };
    ws.send(JSON.stringify(wire));
  }

  /**
   * Resolve with the first received frame matching `predicate`. If `ms` elapses
   * with no match, reject. Frames already in the buffer are checked first
   * UNLESS `opts.afterIndex` is set — in which case only frames at index
   * ≥ afterIndex are considered (use `mark()` to capture the watermark).
   *
   * The watermark is critical for "did the server emit a *new* frame after
   * my command?" assertions — without it a stale state-update from setup
   * can match a post-command predicate and the test passes incorrectly.
   *
   * @param {(f: ServerFrame) => boolean} predicate
   * @param {number} ms
   * @param {{ afterIndex?: number }} [opts]
   */
  function waitFor(predicate, ms = 4000, opts = {}) {
    const startIdx = opts.afterIndex ?? 0;
    return new Promise((resolve, reject) => {
      // First scan existing buffer from the watermark forward.
      for (let i = startIdx; i < frames.length; i++) {
        if (predicate(frames[i])) return resolve(frames[i]);
      }
      const timer = setTimeout(() => {
        const i = waiters.indexOf(check);
        if (i >= 0) waiters.splice(i, 1);
        reject(new Error(`waitFor timeout after ${ms}ms`));
      }, ms);
      function check(f) {
        if (!predicate(f)) return;
        clearTimeout(timer);
        const i = waiters.indexOf(check);
        if (i >= 0) waiters.splice(i, 1);
        resolve(f);
      }
      waiters.push(check);
    });
  }

  function close() {
    if (!closed) ws.close();
  }

  /** Capture a watermark — frames already received don't satisfy later waitFors. */
  function mark() {
    return frames.length;
  }

  return {
    url,
    ws,
    frames,
    send,
    waitFor,
    mark,
    close,
    get closed() {
      return closed;
    },
    get lastError() {
      return lastError;
    },
  };
}

/** Convenience: open facilitator → wait for initial state-update → return driver. */
export async function openFacilitator(baseUrl, roomCode, opts = {}) {
  const drv = await connect({ baseUrl, roomCode, role: "facilitator", name: opts.name ?? "facilitator" });
  const first = await drv.waitFor((f) => f.type === "state-update");
  return { driver: drv, state: first.state, yourId: first.yourId };
}

/** Convenience: open participant → wait for initial state-update → return driver. */
export async function openParticipant(baseUrl, roomCode, name, participantRole = "participant") {
  const drv = await connect({ baseUrl, roomCode, role: "participant", name, participantRole });
  const first = await drv.waitFor((f) => f.type === "state-update");
  return { driver: drv, state: first.state, yourId: first.yourId };
}

/** Generate a unique room code for an isolated test. Format matches what raft-house users see. */
export function newRoomCode(prefix = "TEST") {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${t}${r}`;
}
