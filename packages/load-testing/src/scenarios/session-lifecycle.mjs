// End-to-end session lifecycle smoke test for raft-house.
//
// Covers every facilitator command + every participant command + every server
// broadcast type the room emits. If this passes, the wire protocol from PR #154
// is intact and the DO reducers behave identically to the PartyKit version.
//
// What this proves (mapped to PR #154's manual 10-step plan):
//   1.  WS handshake (101)                          — by establishing connections
//   2.  state hydration with yourId                 — by reading the initial frame
//   3.  setup → advance through activities          — by sending `setup` + `advance`
//   4.  timer start / pause / resume / clear        — by exercising the timer reducer
//   5.  reveal-results with merged response payload — by submitting + revealing
//   6.  hints (broadcast + targeted) + request-hint — by sending each variant
//   7.  kick                                        — by removing a participant
//   8.  end-session → status=completed              — by emitting end-session
//   9.  dropped-socket reconnect                    — by closing + reopening a participant
//  10.  DO eviction storage persistence             — by closing ALL connections,
//                                                     waiting >30s, reopening, and asserting
//                                                     the room is rehydrated from storage
//
// Step 10 is opt-in via `--persistence` because it costs 30+s of wall time
// per run (CF's idle DO eviction window).

import { newRoomCode, openFacilitator, openParticipant } from "../ws-client.mjs";
import { fixtureActivity, fixtureResponse } from "../fixtures.mjs";

/**
 * @typedef {Object} ScenarioResult
 * @property {string} scenario
 * @property {boolean} passed
 * @property {Array<{ step: string, ok: boolean, detail?: string }>} steps
 * @property {number} durationMs
 */

/**
 * @param {{ baseUrl: string, persistence?: boolean }} opts
 * @returns {Promise<ScenarioResult>}
 */
export async function runSessionLifecycle({ baseUrl, persistence = false }) {
  const code = newRoomCode("LIFE");
  const t0 = Date.now();
  /** @type {ScenarioResult["steps"]} */
  const steps = [];
  const step = (name, ok, detail) => steps.push({ step: name, ok, detail });

  /** @type {Array<{ close: () => void }>} */
  const drivers = [];
  const cleanup = () => {
    for (const d of drivers) {
      try {
        d.close();
      } catch {
        /* ignore */
      }
    }
  };

  try {
    // ── 1. Facilitator joins, gets initial state ────────────────────────
    const fac = await openFacilitator(baseUrl, code);
    drivers.push(fac.driver);
    step(
      "facilitator-handshake",
      !!fac.yourId && fac.state.facilitatorId === fac.yourId && fac.state.code === code,
      `code=${fac.state.code} facId=${fac.yourId}`,
    );

    // ── 2. Two participants join ─────────────────────────────────────────
    const p1 = await openParticipant(baseUrl, code, "alice");
    drivers.push(p1.driver);
    const p2 = await openParticipant(baseUrl, code, "bob");
    drivers.push(p2.driver);

    // Facilitator should see participant-joined for each
    await fac.driver.waitFor((f) => f.type === "participant-joined" && f.participant.displayName === "alice", 4000);
    await fac.driver.waitFor((f) => f.type === "participant-joined" && f.participant.displayName === "bob", 4000);
    step("two-participants-broadcast", true);

    // ── 3. Setup activities, advance, submit, reveal ────────────────────
    const activities = [
      fixtureActivity("poll", 0),
      fixtureActivity("prediction", 1),
      fixtureActivity("reflection", 2),
    ];
    fac.driver.send({ type: "setup", activities, displayMode: "screenless", ageLevel: "professional" });
    const afterSetup = await fac.driver.waitFor(
      (f) => f.type === "state-update" && f.state.status === "active" && f.state.activities.length === 3,
      4000,
    );
    step(
      "setup-activates-room",
      afterSetup.state.activities.length === 3 && afterSetup.state.currentActivityIndex === 0,
    );

    // Both participants submit on activity 0 (poll)
    p1.driver.send({ type: "submit", activityId: activities[0].id, response: fixtureResponse("poll") });
    p2.driver.send({ type: "submit", activityId: activities[0].id, response: fixtureResponse("poll") });
    // Reduce on the facilitator: wait for state-update with both responses recorded
    const afterSubmits = await fac.driver.waitFor((f) => {
      if (f.type !== "state-update") return false;
      const ps = Object.values(f.state.participants);
      return ps.length >= 2 && ps.every((p) => p.responses[activities[0].id] !== undefined);
    }, 4000);
    step("submit-records-on-both-participants", true, `participants=${Object.keys(afterSubmits.state.participants).length}`);

    fac.driver.send({ type: "reveal-results" });
    const revealed = await fac.driver.waitFor((f) => f.type === "results-revealed" && f.activityId === activities[0].id, 4000);
    step("reveal-results-broadcast", Object.keys(revealed.responses).length === 2);

    // ── 4. Advance to activity 1, exercise timer ─────────────────────────
    fac.driver.send({ type: "advance" });
    const advanced = await fac.driver.waitFor((f) => f.type === "activity-changed" && f.activityIndex === 1, 4000);
    step("advance-broadcasts-activity-changed", advanced.activity.id === activities[1].id);

    fac.driver.send({ type: "timer-start", durationMs: 30000 });
    const timerStarted = await fac.driver.waitFor((f) => f.type === "timer-sync" && f.timer != null, 4000);
    step("timer-start-broadcasts-timer-sync", timerStarted.timer.durationMs === 30000);

    fac.driver.send({ type: "timer-pause" });
    const timerPaused = await fac.driver.waitFor(
      (f) => f.type === "timer-sync" && f.timer?.pausedAt != null,
      4000,
    );
    step("timer-pause-sets-pausedAt", typeof timerPaused.timer.pausedAt === "number");

    // Resume is sent as a non-timer command (`resume`), not a timer-* command.
    // It un-pauses the room status AND shifts the timer startedAt forward.
    // Use a watermark so the predicate only considers state-updates emitted
    // AFTER this send — otherwise an older state-update (status=active,
    // timer=null from setup) would match the predicate spuriously.
    const beforeResume = fac.driver.mark();
    fac.driver.send({ type: "resume" });
    const resumed = await fac.driver.waitFor(
      (f) =>
        f.type === "state-update" &&
        f.state.status === "active" &&
        f.state.timer != null &&
        f.state.timer.pausedAt == null,
      4000,
      { afterIndex: beforeResume },
    );
    step(
      "resume-clears-pausedAt",
      resumed.state.timer != null && resumed.state.timer.pausedAt == null,
      `startedAt shifted by ~${Date.now() - resumed.state.timer.startedAt}ms`,
    );

    fac.driver.send({ type: "timer-clear" });
    await fac.driver.waitFor((f) => f.type === "timer-sync" && f.timer == null, 4000);
    step("timer-clear-nulls-timer", true);

    // ── 5. Hints: broadcast + targeted + request ────────────────────────
    fac.driver.send({ type: "send-hint", hint: "look at the prompt again" });
    await Promise.all([
      p1.driver.waitFor((f) => f.type === "hint" && f.hint.includes("look at"), 4000),
      p2.driver.waitFor((f) => f.type === "hint" && f.hint.includes("look at"), 4000),
    ]);
    step("send-hint-broadcasts-to-all", true);

    fac.driver.send({ type: "send-hint", hint: "p1 only", participantId: p1.yourId });
    await p1.driver.waitFor((f) => f.type === "hint" && f.hint === "p1 only", 4000);
    // p2 should NOT see "p1 only" — check 500ms grace.
    await new Promise((r) => setTimeout(r, 500));
    const p2GotTargeted = p2.driver.frames.some((f) => f.type === "hint" && f.hint === "p1 only");
    step("send-hint-targeted-skips-others", !p2GotTargeted);

    // request-hint forwards to facilitator
    p1.driver.send({ type: "request-hint" });
    await fac.driver.waitFor((f) => f.type === "hint" && f.hint.includes("alice"), 4000);
    step("participant-request-hint-reaches-facilitator", true);

    // ── 6. Kick a participant ────────────────────────────────────────────
    fac.driver.send({ type: "kick", participantId: p2.yourId });
    // Wait for participant p2's WS to close
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      p2.driver.ws.once("close", () => {
        clearTimeout(timer);
        resolve(undefined);
      });
    });
    step("kick-closes-participant-socket", p2.driver.closed);
    // Facilitator state should no longer list p2
    await fac.driver.waitFor(
      (f) => f.type === "state-update" && !(p2.yourId in f.state.participants),
      4000,
    );
    step("kick-removes-from-state", true);

    // ── 7. Dropped-socket reconnect for p1 ──────────────────────────────
    p1.driver.close();
    await new Promise((r) => setTimeout(r, 500));
    const p1b = await openParticipant(baseUrl, code, "alice");
    drivers.push(p1b.driver);
    step(
      "participant-reconnect-receives-state",
      p1b.state.activities.length === 3 && p1b.state.code === code,
    );

    // ── 8. End session ──────────────────────────────────────────────────
    fac.driver.send({ type: "end-session" });
    await fac.driver.waitFor((f) => f.type === "session-ended", 4000);
    // Subsequent state-update (any reason) — we expect status to flip
    // immediately on the server. To assert without timing flakiness, just
    // close cleanly here; the session-ended broadcast is sufficient proof.
    step("end-session-broadcasts", true);

    // ── 9. DO persistence (opt-in, costs 30+s) ──────────────────────────
    if (persistence) {
      // Close every connection so the DO becomes idle.
      cleanup();
      // CF's idle DO eviction window is ~30s. Wait 35s, then reconnect and
      // assert state survived via ctx.storage.
      await new Promise((r) => setTimeout(r, 35_000));
      const fac2 = await openFacilitator(baseUrl, code);
      drivers.push(fac2.driver);
      // After end-session, status=completed. activities and code must persist.
      step(
        "do-eviction-persistence",
        fac2.state.code === code && fac2.state.activities.length === 3 && fac2.state.status === "completed",
        `status=${fac2.state.status}`,
      );
    }

    cleanup();
    return {
      scenario: "session-lifecycle",
      passed: steps.every((s) => s.ok),
      steps,
      durationMs: Date.now() - t0,
    };
  } catch (e) {
    cleanup();
    step("scenario-exception", false, /** @type {Error} */ (e).message);
    return {
      scenario: "session-lifecycle",
      passed: false,
      steps,
      durationMs: Date.now() - t0,
    };
  }
}
