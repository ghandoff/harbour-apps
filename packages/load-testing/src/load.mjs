// Configurable load runner — spawns N rooms × M participants × T seconds and
// measures WebSocket-layer latency + error rate. Used to validate the
// PartyServer migration under realistic concurrency before the old PartyKit
// host is retired.
//
// Output: connection-success rate, message RTT (p50/p95/p99), broadcast
// fanout latency (single facilitator send → all participants observe),
// error counts grouped by category.
//
// COST WARNING:
//   This hits the live wv-harbour-raft-house Worker. Each connection +
//   message counts as Worker requests (per the CF Workers pricing model).
//   For the smoke tier (N=2, M=2, T=10s) total spend is pennies. For the
//   heavy tier (N=50, M=100, T=300s) you're approaching the $10 spending
//   cap from CLAUDE.md. ALWAYS get explicit approval before running a tier
//   above smoke.

import { newRoomCode, openFacilitator, openParticipant } from "./ws-client.mjs";
import { fixtureActivity, fixtureResponse, ACTIVITY_TYPES } from "./fixtures.mjs";

/**
 * @typedef {Object} LoadConfig
 * @property {string} baseUrl
 * @property {number} rooms             - concurrent rooms
 * @property {number} participantsPerRoom - participants per room
 * @property {number} durationMs        - test duration
 * @property {number} [submitIntervalMs=2000] - how often each participant submits
 */

/**
 * @typedef {Object} LoadResult
 * @property {LoadConfig} config
 * @property {number} startedAt
 * @property {number} endedAt
 * @property {number} totalConnections
 * @property {number} connectionsOk
 * @property {number} connectionsFailed
 * @property {number} totalMessages
 * @property {Record<string, number>} errors
 * @property {{ p50: number, p95: number, p99: number, max: number, count: number }} broadcastFanoutMs
 * @property {{ p50: number, p95: number, p99: number, max: number, count: number }} stateUpdateRTTms
 */

function pct(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const i = Math.min(sortedArr.length - 1, Math.floor((p / 100) * sortedArr.length));
  return sortedArr[i];
}

function statsOf(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  return {
    p50: pct(sorted, 50),
    p95: pct(sorted, 95),
    p99: pct(sorted, 99),
    max: sorted[sorted.length - 1] ?? 0,
    count: sorted.length,
  };
}

/**
 * @param {LoadConfig} config
 * @returns {Promise<LoadResult>}
 */
export async function runLoad(config) {
  const { baseUrl, rooms, participantsPerRoom, durationMs, submitIntervalMs = 2000 } = config;
  const startedAt = Date.now();
  let totalConnections = 0;
  let connectionsOk = 0;
  let connectionsFailed = 0;
  let totalMessages = 0;
  /** @type {Record<string, number>} */
  const errors = {};
  /** @type {number[]} */
  const broadcastFanoutMs = [];
  /** @type {number[]} */
  const stateUpdateRTTms = [];

  const recordError = (key) => {
    errors[key] = (errors[key] ?? 0) + 1;
  };

  // Stagger room creation slightly so we don't hammer the Worker with N
  // simultaneous Durable-Object spin-ups. 50ms feels gentle and natural.
  const roomTasks = [];
  for (let r = 0; r < rooms; r++) {
    roomTasks.push(
      (async () => {
        await new Promise((res) => setTimeout(res, r * 50));
        const code = newRoomCode(`LOAD-${r}`);
        let fac;
        try {
          totalConnections++;
          fac = await openFacilitator(baseUrl, code, { name: `facilitator-${r}` });
          connectionsOk++;
        } catch (e) {
          connectionsFailed++;
          recordError(`facilitator-open: ${/** @type {Error} */ (e).message}`);
          return;
        }

        // Push a single activity per room — the activity cycles through the 9
        // types based on room index so we get coverage at load.
        const activity = fixtureActivity(ACTIVITY_TYPES[r % ACTIVITY_TYPES.length], 0);
        fac.driver.send({ type: "setup", activities: [activity], displayMode: "screenless", ageLevel: "professional" });

        // Spawn participants
        const participants = [];
        for (let p = 0; p < participantsPerRoom; p++) {
          totalConnections++;
          try {
            const part = await openParticipant(baseUrl, code, `p${r}-${p}`);
            connectionsOk++;
            participants.push(part);
          } catch (e) {
            connectionsFailed++;
            recordError(`participant-open: ${/** @type {Error} */ (e).message}`);
          }
        }

        // Per-room broadcast fanout probe: facilitator sends a hint, EVERY
        // participant should see it within some delta. We measure max delta
        // across participants for this round.
        const broadcastProbe = async () => {
          if (participants.length === 0) return;
          const marker = `marker-${Date.now()}-${r}`;
          const sentAt = Date.now();
          fac.driver.send({ type: "send-hint", hint: marker });
          const arrivals = await Promise.all(
            participants.map((p) =>
              p.driver
                .waitFor((f) => f.type === "hint" && f.hint === marker, 5000)
                .then(() => Date.now() - sentAt)
                .catch(() => null),
            ),
          );
          const ok = arrivals.filter((a) => a !== null);
          if (ok.length > 0) broadcastFanoutMs.push(Math.max(...ok));
          if (ok.length < participants.length) {
            recordError(`broadcast-fanout-partial: ${ok.length}/${participants.length}`);
          }
        };

        // Per-participant submit probe: send `submit`, measure RTT until
        // facilitator sees a state-update reflecting the submission.
        const submitProbe = async (p) => {
          const sentAt = Date.now();
          const response = fixtureResponse(activity.type);
          p.driver.send({ type: "submit", activityId: activity.id, response });
          try {
            await fac.driver.waitFor((f) => {
              if (f.type !== "state-update") return false;
              return f.state.participants[p.yourId]?.responses?.[activity.id] !== undefined;
            }, 5000);
            stateUpdateRTTms.push(Date.now() - sentAt);
            totalMessages++;
          } catch (e) {
            recordError(`submit-rtt-timeout`);
          }
        };

        // Activity loop until duration elapses.
        const deadline = startedAt + durationMs;
        while (Date.now() < deadline) {
          for (const p of participants) {
            if (Date.now() >= deadline) break;
            await submitProbe(p);
          }
          if (Date.now() >= deadline) break;
          await broadcastProbe();
          await new Promise((res) => setTimeout(res, submitIntervalMs));
        }

        // Cleanup
        try {
          fac.driver.close();
        } catch {
          /* ignore */
        }
        for (const p of participants) {
          try {
            p.driver.close();
          } catch {
            /* ignore */
          }
        }
      })(),
    );
  }

  await Promise.all(roomTasks);

  return {
    config,
    startedAt,
    endedAt: Date.now(),
    totalConnections,
    connectionsOk,
    connectionsFailed,
    totalMessages,
    errors,
    broadcastFanoutMs: statsOf(broadcastFanoutMs),
    stateUpdateRTTms: statsOf(stateUpdateRTTms),
  };
}

/** Pre-canned tiers. */
export const LOAD_TIERS = {
  smoke: { rooms: 2, participantsPerRoom: 2, durationMs: 10_000, submitIntervalMs: 1500 },
  moderate: { rooms: 10, participantsPerRoom: 20, durationMs: 5 * 60_000, submitIntervalMs: 2000 },
  heavy: { rooms: 50, participantsPerRoom: 100, durationMs: 5 * 60_000, submitIntervalMs: 3000 },
};
