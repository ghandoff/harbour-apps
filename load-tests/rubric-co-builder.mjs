/**
 * Load test: Rubric Co-Builder
 *
 * Scenarios (set via SCENARIO env var):
 *
 *   full            — baseline: 20 rooms × 15 participants, lobby → commit
 *   stagger         — rooms start at random intervals over STAGGER_MS window
 *   slow            — participants wait THINK_TIME_MS before acting (distracted users)
 *   rejoin          — dropped participants reconnect after REJOIN_DELAY_MS
 *   latency         — LATENCY_MS artificial round-trip delay per request (simulates
 *                     international users: ~100ms EU, ~300ms APAC)
 *   facilitator-race — N concurrent tally / PATCH calls per room to probe double-advance
 *   collision       — COLLISION_ROOMS rooms created in a single burst; checks for
 *                     duplicate codes
 *
 * Usage:
 *   node load-tests/rubric-co-builder.mjs
 *   SCENARIO=stagger STAGGER_MS=30000 node load-tests/rubric-co-builder.mjs
 *   SCENARIO=latency LATENCY_MS=300 node load-tests/rubric-co-builder.mjs
 *   SCENARIO=collision COLLISION_ROOMS=500 node load-tests/rubric-co-builder.mjs
 */

const BASE_URL         = process.env.BASE_URL          ?? "http://localhost:3030";
const ROOMS            = Number(process.env.ROOMS)      || 20;
const PER_ROOM         = Number(process.env.PER_ROOM)   || 15;
const DROPOUT_RATE     = Number(process.env.DROPOUT_RATE) || 0.2;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 500;
const STEP_DWELL_MS    = Number(process.env.STEP_DWELL_MS)    || 2000;
const OVER_VOTE        = Number(process.env.OVER_VOTE)  || 1;
const SCENARIO         = process.env.SCENARIO           || "full";
const STAGGER_MS       = Number(process.env.STAGGER_MS) || 30000;
const THINK_TIME_MS    = Number(process.env.THINK_TIME_MS)    || 5000;
const LATENCY_MS       = Number(process.env.LATENCY_MS) || 0;
const REJOIN_DELAY_MS  = Number(process.env.REJOIN_DELAY_MS)  || 15000;
const COLLISION_ROOMS  = Number(process.env.COLLISION_ROOMS)  || 500;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function jitter(ms) { return Math.random() * ms; }

// ── timing helpers ─────────────────────────────────────────────────────────────

function pct(arr, p) {
  if (!arr.length) return "N/A";
  const s = [...arr].sort((a, b) => a - b);
  return s[p >= 100 ? s.length - 1 : Math.floor(s.length * p / 100)].toFixed(0) + "ms";
}

function row(label, timings) {
  const ok  = timings.filter((t) => t.ok);
  const bad = timings.filter((t) => !t.ok);
  const ms  = ok.map((t) => t.ms);
  const badStr = bad.length
    ? `  fail=${bad.length}(${JSON.stringify(bad.reduce((a, t) => { a[t.status || "net"] = (a[t.status || "net"] ?? 0) + 1; return a; }, {}))})`
    : "";
  console.log(
    `  ${label.padEnd(22)}  ok=${String(ok.length).padStart(4)}${badStr}` +
    (ms.length ? `  p50=${pct(ms, 50)}  p95=${pct(ms, 95)}  p99=${pct(ms, 99)}  max=${pct(ms, 100)}` : ""),
  );
  return { ok: ok.length, fail: bad.length, ms };
}

// ── http helper ────────────────────────────────────────────────────────────────

async function req(method, path, body) {
  if (LATENCY_MS) await sleep(LATENCY_MS * 0.5 + jitter(LATENCY_MS));
  const t0 = performance.now();
  try {
    const init = { method, headers: { "content-type": "application/json" } };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, init);
    const ms = performance.now() - t0;
    let json = null;
    try { json = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, ms, json };
  } catch (err) {
    return { ok: false, status: 0, ms: performance.now() - t0, json: null, error: String(err) };
  }
}

// ── participant actions ────────────────────────────────────────────────────────

async function participantAct(participantId, roomCode, state, snap, timings, overVoteTimings) {
  const pid = participantId;
  const code = roomCode;
  const push = (t) => timings.push(t);

  if (state === "propose") {
    const t = await req("POST", `/api/rooms/${code}/criteria`, {
      name: `criterion-${pid.slice(0, 6)}`,
      good_description: "demonstrates clear understanding of the learning outcome.",
    });
    push({ op: "propose", ok: t.ok, status: t.status, ms: t.ms });
    return;
  }

  if (state === "vote" || state === "vote3") {
    const round = state === "vote3" ? 3 : 1;
    const criteria = snap.criteria.filter((c) => c.status !== "rejected");
    const maxVotes = Math.min(3, Math.max(1, criteria.length - 1));
    const toCast = Math.min(maxVotes + (state === "vote" ? OVER_VOTE : 0), criteria.length);
    await Promise.all(
      criteria.slice(0, toCast).map((c, idx) =>
        req("POST", `/api/rooms/${code}/votes`, {
          participant_id: pid, criterion_id: c.id, round,
        }).then(({ ok, status, ms }) => {
          const target = state === "vote" && idx >= maxVotes ? overVoteTimings : timings;
          target.push({ op: state, ok, status, ms });
        }),
      ),
    );
    return;
  }

  if (state === "scale") {
    for (const c of snap.criteria.filter((c) => c.status !== "rejected").slice(0, 2)) {
      const t = await req("PATCH", `/api/rooms/${code}/scale-responses`, {
        participant_id: pid, criterion_id: c.id, level: 4,
        descriptor: "the work exemplifies sophisticated and consistent understanding.",
      });
      push({ op: "scale", ok: t.ok, status: t.status, ms: t.ms });
    }
    return;
  }

  if (state === "vote2") {
    for (const sr of snap.scale_responses.filter((sr) => sr.participant_id !== pid).slice(0, 2)) {
      const t = await req("POST", `/api/rooms/${code}/scale-response-votes`, {
        participant_id: pid, scale_response_id: sr.id,
      });
      push({ op: "vote2", ok: t.ok, status: t.status, ms: t.ms });
    }
    return;
  }

  if (state === "ai_ladder_propose") {
    const t = await req("POST", `/api/rooms/${code}/ai-proposals`, {
      participant_id: pid, level: 2,
      rationale: "ai assists but critical thinking must remain with the student.",
    });
    push({ op: "ai-propose", ok: t.ok, status: t.status, ms: t.ms });
    return;
  }

  if (state === "ai_ladder") {
    const t = await req("POST", `/api/rooms/${code}/ai-votes`, {
      participant_id: pid, level: 2,
    });
    push({ op: "ai-vote", ok: t.ok, status: t.status, ms: t.ms });
    return;
  }

  if (state === "pledge") {
    for (let slot = 1; slot <= 4; slot++) {
      const t = await req("PATCH", `/api/rooms/${code}/pledge-responses`, {
        participant_id: pid, slot_index: slot,
        content: "i commit to using ai as a thinking partner, not a replacement.",
      });
      push({ op: "pledge", ok: t.ok, status: t.status, ms: t.ms });
    }
    return;
  }

  if (state === "pledge_vote") {
    for (const pr of snap.pledge_responses.filter((pr) => pr.participant_id !== pid).slice(0, 4)) {
      const t = await req("POST", `/api/rooms/${code}/pledge-response-votes`, {
        participant_id: pid, pledge_response_id: pr.id,
      });
      push({ op: "pledge-vote", ok: t.ok, status: t.status, ms: t.ms });
    }
    return;
  }
}

// ── participant poll loop ──────────────────────────────────────────────────────

async function runParticipant(participant, roomCtx, timings, overVoteTimings, syncLags, stopFlag) {
  if (participant.dropped && SCENARIO !== "rejoin") return;

  // rejoin scenario: dropped participants wait then come back with a new identity
  if (participant.dropped && SCENARIO === "rejoin") {
    await sleep(REJOIN_DELAY_MS + jitter(REJOIN_DELAY_MS * 0.5));
    const r = await req("POST", `/api/rooms/${participant.roomCode}/join`);
    timings.push({ op: "rejoin", ok: r.ok, status: r.status, ms: r.ms });
    if (!r.ok || !r.json?.participant_id) return;
    participant.participantId = r.json.participant_id;
    participant.dropped = false;
  }

  let lastSeenState = null;
  const actedFor = new Set();

  while (!stopFlag.done) {
    await sleep(POLL_INTERVAL_MS + jitter(POLL_INTERVAL_MS * 0.3));
    const { ok, status, ms, json } = await req("GET", `/api/rooms/${participant.roomCode}`);
    timings.push({ op: "poll", ok, status, ms });
    if (!ok || !json?.room) continue;

    const state = json.room.state;
    if (state !== lastSeenState) {
      const lag = Date.now() - (roomCtx.stateAdvancedAt[state] ?? Date.now());
      syncLags.push({ state, lag });
      lastSeenState = state;

      if (!actedFor.has(state)) {
        actedFor.add(state);
        if (THINK_TIME_MS) await sleep(THINK_TIME_MS * 0.2 + jitter(THINK_TIME_MS * 0.8));
        await participantAct(
          participant.participantId, participant.roomCode, state, json, timings, overVoteTimings,
        ).catch(() => {});
      }
    }
    if (state === "commit") break;
  }
}

// ── facilitator ────────────────────────────────────────────────────────────────

async function runFacilitator(roomCode, roomCtx, timings) {
  const advance = async (state) => {
    const t = await req("PATCH", `/api/rooms/${roomCode}`, { state });
    timings.push({ op: `adv:${state}`, ok: t.ok, status: t.status, ms: t.ms });
    roomCtx.stateAdvancedAt[state] = Date.now();
  };
  const tally = async (endpoint) => {
    const t = await req("POST", `/api/rooms/${roomCode}/${endpoint}`);
    timings.push({ op: endpoint, ok: t.ok, status: t.status, ms: t.ms });
    if (t.json?.advanced_to) roomCtx.stateAdvancedAt[t.json.advanced_to] = Date.now();
    return t.json;
  };

  await sleep(200);
  await advance("frame");    await sleep(STEP_DWELL_MS);
  await advance("propose");  await sleep(STEP_DWELL_MS);
  await advance("vote");     await sleep(STEP_DWELL_MS);
  await tally("tally");
  roomCtx.stateAdvancedAt["criteria_gate"] = Date.now();
  await sleep(500);

  const { json: snap1 } = await req("GET", `/api/rooms/${roomCode}`);
  const selectedIds = (snap1?.criteria ?? []).filter((c) => c.status !== "rejected").map((c) => c.id);
  const fc = await req("POST", `/api/rooms/${roomCode}/facilitator-choice`, { selected_ids: selectedIds });
  timings.push({ op: "facilitator-choice", ok: fc.ok, status: fc.status, ms: fc.ms });
  await advance("scale");    await sleep(STEP_DWELL_MS);
  await advance("vote2");    await sleep(STEP_DWELL_MS);
  await tally("tally2");
  roomCtx.stateAdvancedAt["ai_ladder_propose"] = Date.now();
  await sleep(STEP_DWELL_MS);
  await tally("ai-tally");
  roomCtx.stateAdvancedAt["ai_ladder"] = Date.now();
  await sleep(STEP_DWELL_MS);
  await tally("ai-tally");
  roomCtx.stateAdvancedAt["vote3"] = Date.now();
  await sleep(STEP_DWELL_MS);
  await tally("ai-tally");
  roomCtx.stateAdvancedAt["pledge"] = Date.now();

  for (let i = 1; i <= 4; i++) {
    await req("PATCH", `/api/rooms/${roomCode}/pledge`, {
      slot_index: i, content: `slot ${i}: describe your commitment to responsible ai use.`,
    });
  }
  await sleep(STEP_DWELL_MS);
  await advance("pledge_vote"); await sleep(STEP_DWELL_MS);
  await tally("tally-pledge");
  roomCtx.stateAdvancedAt["commit"] = Date.now();
}

// ── per-room orchestration ─────────────────────────────────────────────────────

async function runRoom(roomIdx, timings, overVoteTimings, syncLags) {
  if (SCENARIO === "stagger") await sleep(jitter(STAGGER_MS));

  const create = await req("POST", "/api/rooms", {
    learning_outcome: `loadtest outcome ${roomIdx + 1}: apply threshold concepts under load`,
    project_description: `loadtest project ${roomIdx + 1}: a research report demonstrating conceptual understanding`,
  });
  timings.push({ op: "create", ok: create.ok, status: create.status, ms: create.ms });
  if (!create.ok || !create.json?.code) return { completed: false, code: null, joined: 0, dropped: 0 };
  const code = create.json.code;

  const joinResults = await Promise.allSettled(
    Array.from({ length: PER_ROOM }, () => req("POST", `/api/rooms/${code}/join`)),
  );
  const participants = [];
  for (const r of joinResults) {
    if (r.status !== "fulfilled" || !r.value.ok) {
      timings.push({ op: "join", ok: false, status: r.value?.status ?? 0, ms: r.value?.ms ?? 0 });
      continue;
    }
    timings.push({ op: "join", ok: true, status: r.value.status, ms: r.value.ms });
    participants.push({ participantId: r.value.json.participant_id, roomCode: code, dropped: false });
  }

  let droppedCount = 0;
  for (const p of participants) {
    if (Math.random() < DROPOUT_RATE) { p.dropped = true; droppedCount++; }
  }

  const roomCtx = { stateAdvancedAt: {} };
  const stopFlag = { done: false };

  await Promise.allSettled([
    runFacilitator(code, roomCtx, timings).then(() => { stopFlag.done = true; }),
    ...participants.map((p) =>
      runParticipant(p, roomCtx, timings, overVoteTimings, syncLags, stopFlag),
    ),
  ]);

  const { json: final } = await req("GET", `/api/rooms/${code}`);
  return { completed: final?.room?.state === "commit", code, joined: participants.length, dropped: droppedCount };
}

// ── full / variant flow ────────────────────────────────────────────────────────

async function runFullFlow(label) {
  const allTimings = [], overVoteTimings = [], syncLags = [];
  const start = performance.now();

  const results = await Promise.allSettled(
    Array.from({ length: ROOMS }, (_, i) => runRoom(i, allTimings, overVoteTimings, syncLags)),
  );
  const totalMs = performance.now() - start;

  console.log("\n── Per-operation latency ─────────────────────────────────────────");
  const byOp = {};
  for (const t of allTimings) { if (!byOp[t.op]) byOp[t.op] = []; byOp[t.op].push(t); }
  for (const [op, ts] of Object.entries(byOp)) row(op, ts);

  if (overVoteTimings.length) {
    console.log("\n── Vote race probe ───────────────────────────────────────────────");
    row("within quota", allTimings.filter((t) => t.op === "vote"));
    row("over quota",   overVoteTimings);
    const raced = overVoteTimings.filter((t) => t.status === 201).length;
    console.log(raced > 0
      ? `\n  !! TOCTOU CONFIRMED: ${raced} over-quota votes returned 201`
      : `  over-quota votes: all 409`);
  }

  console.log("\n── Sync lag (PATCH → detected by participant) ────────────────────");
  const lagByState = {};
  for (const { state, lag } of syncLags) { if (!lagByState[state]) lagByState[state] = []; lagByState[state].push(lag); }
  for (const [state, lags] of Object.entries(lagByState)) {
    const valid = lags.filter((l) => l >= 0);
    if (!valid.length) continue;
    console.log(`  ${state.padEnd(22)}  n=${String(valid.length).padStart(4)}  p50=${pct(valid, 50)}  p95=${pct(valid, 95)}  max=${pct(valid, 100)}`);
  }

  let completed = 0, totalJoined = 0, totalDropped = 0;
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    if (r.value.completed) completed++;
    totalJoined  += r.value.joined  ?? 0;
    totalDropped += r.value.dropped ?? 0;
  }
  console.log("\n── Room outcomes ─────────────────────────────────────────────────");
  console.log(`  rooms reaching commit:  ${completed} / ${ROOMS}`);
  console.log(`  participants joined:    ${totalJoined} / ${ROOMS * PER_ROOM}`);
  console.log(`  participants dropped:   ${totalDropped}  (active: ${totalJoined - totalDropped})`);
  console.log(`  total wall time:        ${(totalMs / 1000).toFixed(1)}s`);
  console.log("──────────────────────────────────────────────────────────────────\n");
  return { completed, rooms: ROOMS };
}

// ── facilitator race ──────────────────────────────────────────────────────────
// Tests what happens when two facilitators fire PATCH / tally simultaneously.
// Creates ROOMS rooms, drives each to the vote phase, then fires RACE_CALLERS
// concurrent tally calls and checks whether the room ends in a consistent state.

async function runFacilitatorRace() {
  const RACE_CALLERS = Number(process.env.RACE_CALLERS) || 5;
  const timings = [];
  const start = performance.now();

  const rooms = await Promise.all(
    Array.from({ length: ROOMS }, (_, i) =>
      req("POST", "/api/rooms", {
        learning_outcome: `race test ${i + 1}`,
        project_description: `race test ${i + 1}`,
      }).then((r) => r.json?.code),
    ),
  );

  // join participants and advance to vote
  await Promise.all(rooms.filter(Boolean).flatMap((code) => [
    ...Array.from({ length: PER_ROOM }, () => req("POST", `/api/rooms/${code}/join`)),
    req("PATCH", `/api/rooms/${code}`, { state: "vote" }),
  ]));

  // vote with each participant so tally has something to work with
  const snaps = await Promise.all(rooms.filter(Boolean).map((code) => req("GET", `/api/rooms/${code}`)));
  await Promise.all(snaps.flatMap(({ json: snap }) => {
    if (!snap) return [];
    const code = snap.room.code;
    const pids = (snap.participants ?? []).map((p) => p.id).filter(Boolean).slice(0, 3);
    const cids = snap.criteria.map((c) => c.id).slice(0, 1);
    return pids.flatMap((pid) => cids.map((cid) =>
      req("POST", `/api/rooms/${code}/votes`, { participant_id: pid, criterion_id: cid, round: 1 }),
    ));
  }));

  // fire RACE_CALLERS concurrent tally calls per room
  const raceResults = await Promise.allSettled(
    rooms.filter(Boolean).flatMap((code) =>
      Array.from({ length: RACE_CALLERS }, (_, i) =>
        req("POST", `/api/rooms/${code}/tally`).then((t) => ({
          code, caller: i, ok: t.ok, status: t.status, ms: t.ms, state: t.json?.state,
        })),
      ),
    ),
  );

  // check: each room should reach criteria_gate exactly once
  const byRoom = {};
  for (const r of raceResults) {
    if (r.status !== "fulfilled") continue;
    const { code, ok, status, ms } = r.value;
    timings.push({ op: "tally-race", ok, status, ms });
    if (!byRoom[code]) byRoom[code] = { ok: 0, fail: 0 };
    if (ok) byRoom[code].ok++;
    else    byRoom[code].fail++;
  }

  const multiAdvance = Object.values(byRoom).filter((b) => b.ok > 1).length;
  const finalStates  = await Promise.all(rooms.filter(Boolean).map((code) =>
    req("GET", `/api/rooms/${code}`).then((r) => r.json?.room?.state),
  ));
  const wrongState = finalStates.filter((s) => s !== "criteria_gate").length;

  const totalMs = performance.now() - start;

  console.log("\n── Facilitator race results ──────────────────────────────────────");
  row("tally (concurrent)", timings);
  console.log(`  rooms where >1 tally returned 200:  ${multiAdvance} / ${ROOMS}  ${multiAdvance ? "⚠ double-advance bug" : "✓ ok"}`);
  console.log(`  rooms NOT in criteria_gate after:   ${wrongState} / ${ROOMS}    ${wrongState ? "⚠ inconsistent state" : "✓ ok"}`);
  console.log(`  total wall time: ${(totalMs / 1000).toFixed(1)}s`);
  console.log("──────────────────────────────────────────────────────────────────\n");
  return { multiAdvance, wrongState };
}

// ── collision test ─────────────────────────────────────────────────────────────

async function runCollisionTest() {
  const timings = [];
  const start = performance.now();
  console.log(`\nCreating ${COLLISION_ROOMS} rooms in a single burst...`);

  const results = await Promise.allSettled(
    Array.from({ length: COLLISION_ROOMS }, () =>
      req("POST", "/api/rooms", {
        learning_outcome: "collision test",
        project_description: "collision test",
      }),
    ),
  );

  const codes = [];
  for (const r of results) {
    if (r.status !== "fulfilled") { timings.push({ op: "create", ok: false, status: 0, ms: 0 }); continue; }
    timings.push({ op: "create", ok: r.value.ok, status: r.value.status, ms: r.value.ms });
    if (r.value.ok && r.value.json?.code) codes.push(r.value.json.code);
  }

  const seen = new Set(), duplicates = [];
  for (const c of codes) { if (seen.has(c)) duplicates.push(c); else seen.add(c); }

  const totalMs = performance.now() - start;

  console.log("\n── Collision test results ────────────────────────────────────────");
  row("POST /rooms", timings);
  console.log(`  rooms created:     ${codes.length} / ${COLLISION_ROOMS}`);
  console.log(`  duplicate codes:   ${duplicates.length}  ${duplicates.length ? "⚠ " + duplicates.join(", ") : "✓ none"}`);
  console.log(`  total wall time:   ${(totalMs / 1000).toFixed(1)}s`);
  console.log("──────────────────────────────────────────────────────────────────\n");
  return { created: codes.length, duplicates: duplicates.length };
}

// ── main dispatch ──────────────────────────────────────────────────────────────

async function main() {
  const scenarioLabel = {
    full:             `baseline — ${ROOMS} rooms × ${PER_ROOM} participants`,
    stagger:          `staggered arrival — rooms start over a ${(STAGGER_MS/1000).toFixed(0)}s window`,
    slow:             `slow / distracted — up to ${(THINK_TIME_MS/1000).toFixed(0)}s think time per step`,
    rejoin:           `dropout + rejoin — dropped users reconnect after ${(REJOIN_DELAY_MS/1000).toFixed(0)}s`,
    latency:          `network latency — ${LATENCY_MS}ms artificial RTT per request`,
    "facilitator-race": `facilitator race — ${process.env.RACE_CALLERS || 5} concurrent tally calls per room`,
    collision:        `room code collision — ${COLLISION_ROOMS} rooms in one burst`,
  }[SCENARIO] ?? SCENARIO;

  console.log(`\nRubric Co-Builder load test — ${scenarioLabel}`);
  console.log(`BASE_URL=${BASE_URL}\n`);

  switch (SCENARIO) {
    case "full":
    case "stagger":
    case "slow":
    case "rejoin":
    case "latency":
      return runFullFlow();
    case "facilitator-race":
      return runFacilitatorRace();
    case "collision":
      return runCollisionTest();
    default:
      console.error(`unknown SCENARIO="${SCENARIO}"`);
      process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
