// 9-activity-type matrix smoke.
//
// For each ActivityType in lib/types.ts, spin up an isolated room with one
// facilitator + one participant, push exactly that activity, have the
// participant submit a type-appropriate response, reveal, and assert the
// response payload survives the round-trip.
//
// Each activity gets its own room (idFromName(<unique code>)) so the matrix
// stays embarrassingly parallel — if one activity type's reducer breaks, the
// others still report. Failed rooms produce a step with `ok: false` and a
// detail message; we don't throw and abort the matrix.
//
// Why we exercise reveal-results per activity: the reducer for reveal-results
// reads participant.responses[activity.id] for the CURRENT activity. Bugs
// where a response is stored under the wrong key are caught here.

import { newRoomCode, openFacilitator, openParticipant } from "../ws-client.mjs";
import { ACTIVITY_TYPES, fixtureActivity, fixtureResponse } from "../fixtures.mjs";

/**
 * @param {{ baseUrl: string }} opts
 */
export async function runActivityMatrix({ baseUrl }) {
  const t0 = Date.now();
  /** @type {Array<{ step: string, ok: boolean, detail?: string }>} */
  const steps = [];

  // Run each activity type sequentially. Parallel would be faster but harder
  // to read in the report, and we're talking ~9s total at ~1s per type.
  for (const type of ACTIVITY_TYPES) {
    const code = newRoomCode(`ACT-${type.slice(0, 4).toUpperCase()}`);
    let fac, p1;
    try {
      fac = await openFacilitator(baseUrl, code);
      p1 = await openParticipant(baseUrl, code, "p1");

      const activity = fixtureActivity(type, 0);
      fac.driver.send({ type: "setup", activities: [activity], displayMode: "screenless", ageLevel: "professional" });
      await fac.driver.waitFor(
        (f) => f.type === "state-update" && f.state.activities.length === 1 && f.state.status === "active",
        4000,
      );

      const response = fixtureResponse(type);
      p1.driver.send({ type: "submit", activityId: activity.id, response });
      await fac.driver.waitFor((f) => {
        if (f.type !== "state-update") return false;
        const stored = Object.values(f.state.participants)[0]?.responses?.[activity.id];
        return JSON.stringify(stored) === JSON.stringify(response);
      }, 4000);

      fac.driver.send({ type: "reveal-results" });
      const revealed = await fac.driver.waitFor(
        (f) => f.type === "results-revealed" && f.activityId === activity.id,
        4000,
      );
      const responseValues = Object.values(revealed.responses);
      const ok =
        responseValues.length === 1 && JSON.stringify(responseValues[0]) === JSON.stringify(response);
      steps.push({
        step: `activity:${type}`,
        ok,
        detail: ok ? "round-trip ok" : `expected ${JSON.stringify(response)}, got ${JSON.stringify(responseValues[0])}`,
      });
    } catch (e) {
      steps.push({
        step: `activity:${type}`,
        ok: false,
        detail: /** @type {Error} */ (e).message,
      });
    } finally {
      try {
        fac?.driver.close();
      } catch {
        /* ignore */
      }
      try {
        p1?.driver.close();
      } catch {
        /* ignore */
      }
    }
  }

  return {
    scenario: "activity-matrix",
    passed: steps.every((s) => s.ok),
    steps,
    durationMs: Date.now() - t0,
  };
}
