/**
 * Load test: Rubric Co-Builder — full end-to-end flow
 *
 * Simulates 20 rooms × 15 participants going through every phase from lobby → commit.
 * All rooms run in parallel; within each room one participant acts as facilitator
 * (advances state), others poll and react.  A configurable fraction of participants
 * drop out randomly after joining, verifying the room can still reach commit.
 *
 * Answers three questions:
 *  1. Can each participant move from one step to the next?
 *  2. Does state sync reach every participant within one poll cycle?
 *  3. Can a room complete regardless of dropouts?
 *
 * Phase 5 also fires maxVotes+OVER_VOTE concurrent vote requests per participant
 * to probe the TOCTOU race in votes/route.ts.
 *
 * Usage (from monorepo root):
 *   node load-tests/rubric-co-builder.mjs
 *
 * Env overrides:
 *   BASE_URL=http://localhost:3030
 *   ROOMS=20
 *   PER_ROOM=15
 *   DROPOUT_RATE=0.2        fraction of participants that drop out after joining
 *   POLL_INTERVAL_MS=500    how often participants poll for state changes
 *   STEP_DWELL_MS=2000      how long facilitator waits at each step before advancing
 *   OVER_VOTE=1             extra votes beyond maxVotes to probe the race
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3030";
const ROOMS = Number(process.env.ROOMS) || 20;
const PER_ROOM = Number(process.env.PER_ROOM) || 15;
const DROPOUT_RATE = Number(process.env.DROPOUT_RATE) || 0.2;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 500;
const STEP_DWELL_MS = Number(process.env.STEP_DWELL_MS) || 2000;
const OVER_VOTE = Number(process.env.OVER_VOTE) || 1;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function jitter(ms) { return Math.random() * ms; }

// ── timing / stats ────────────────────────────────────────────────────────────

function pct(arr, p) {
  if (!arr.length) return "N/A";
  const s = [...arr].sort((a, b) => a - b);
  return s[p >= 100 ? s.length - 1 : Math.floor(s.length * p / 100)].toFixed(0) + "ms";
}

function row(label, timings) {
  const ok = timings.filter((t) => t.ok);
  const bad = timings.filter((t) => !t.ok);
  const ms = ok.map((t) => t.ms);
  const badStr = bad.length
    ? `  fail=${bad.length}(${JSON.stringify(bad.reduce((a, t) => { a[t.status || "net"] = (a[t.status || "net"] ?? 0) + 1; return a; }, {}))})`
    : "";
  console.log(
    `  ${label.padEnd(22)}  ok=${String(ok.length).padStart(4)}${badStr}` +
    (ms.length ? `  p50=${pct(ms, 50)}  p95=${pct(ms, 95)}  p99=${pct(ms, 99)}  max=${pct(ms, 100)}` : ""),
  );
  return { ok: ok.length, fail: bad.length, ms };
}

// ── http ──────────────────────────────────────────────────────────────────────

async function req(method, path, body) {
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

// ── participant action map ────────────────────────────────────────────────────
// called once per participant when they first detect a new state.

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
    const ballotSize = criteria.length;
    const maxVotes = Math.min(3, Math.max(1, ballotSize - 1));
    const toCast = Math.min(maxVotes + OVER_VOTE, criteria.length);
    // fire all requests concurrently to probe the TOCTOU race
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
    const criteria = snap.criteria.filter((c) => c.status !== "rejected");
    for (const c of criteria.slice(0, 2)) {
      const t = await req("PATCH", `/api/rooms/${code}/scale-responses`, {
        participant_id: pid, criterion_id: c.id, level: 4,
        descriptor: "the work exemplifies sophisticated and consistent understanding.",
      });
      push({ op: "scale", ok: t.ok, status: t.status, ms: t.ms });
    }
    return;
  }

  if (state === "vote2") {
    const others = snap.scale_responses.filter((sr) => sr.participant_id !== pid);
    for (const sr of others.slice(0, 2)) {
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
    const others = snap.pledge_responses.filter((pr) => pr.participant_id !== pid);
    for (const pr of others.slice(0, 4)) {
      const t = await req("POST", `/api/rooms/${code}/pledge-response-votes`, {
        participant_id: pid, pledge_response_id: pr.id,
      });
      push({ op: "pledge-vote", ok: t.ok, status: t.status, ms: t.ms });
    }
    return;
  }
}

// ── participant poll loop ─────────────────────────────────────────────────────

async function runParticipant(participant, roomCtx, timings, overVoteTimings, syncLags, stopFlag) {
  const { participantId, roomCode, dropped } = participant;
  if (dropped) return;

  let lastSeenState = null;
  const actedFor = new Set();

  while (!stopFlag.done) {
    await sleep(POLL_INTERVAL_MS + jitter(POLL_INTERVAL_MS * 0.3));

    const t0 = performance.now();
    const { ok, status, ms, json } = await req("GET", `/api/rooms/${roomCode}`);
    timings.push({ op: "poll", ok, status, ms });

    if (!ok || !json?.room) continue;

    const state = json.room.state;

    if (state !== lastSeenState) {
      const lag = Date.now() - (roomCtx.stateAdvancedAt[state] ?? Date.now());
      syncLags.push({ state, lag });
      lastSeenState = state;

      if (!actedFor.has(state)) {
        actedFor.add(state);
        await participantAct(participantId, roomCode, state, json, timings, overVoteTimings).catch(() => {});
      }
    }

    if (state === "commit") break;
  }
}

// ── facilitator (drives state machine) ───────────────────────────────────────

async function runFacilitator(roomCode, roomCtx, timings) {
  const advance = async (state) => {
    const t = await req("PATCH", `/api/rooms/${roomCode}`, { state });
    timings.push({ op: `adv:${state}`, ok: t.ok, status: t.status, ms: t.ms });
    roomCtx.stateAdvancedAt[state] = Date.now();
  };

  const tally = async (endpoint) => {
    const t = await req("POST", `/api/rooms/${roomCode}/${endpoint}`);
    timings.push({ op: endpoint, ok: t.ok, status: t.status, ms: t.ms });
    // tally endpoints auto-advance the state — record the new state from the response
    // or fall back to a re-fetch
    if (t.json?.advanced_to) roomCtx.stateAdvancedAt[t.json.advanced_to] = Date.now();
    return t.json;
  };

  // lobby → frame → propose → vote
  await sleep(200);
  await advance("frame");
  await sleep(STEP_DWELL_MS);
  await advance("propose");
  await sleep(STEP_DWELL_MS);
  await advance("vote");
  await sleep(STEP_DWELL_MS);

  // vote → tally → criteria_gate
  await tally("tally");
  roomCtx.stateAdvancedAt["criteria_gate"] = Date.now();
  await sleep(500);

  // criteria_gate: select all non-rejected criteria, then advance to scale
  const { json: snap1 } = await req("GET", `/api/rooms/${roomCode}`);
  const selectedIds = (snap1?.criteria ?? []).filter((c) => c.status !== "rejected").map((c) => c.id);
  const fc = await req("POST", `/api/rooms/${roomCode}/facilitator-choice`, { selected_ids: selectedIds });
  timings.push({ op: "facilitator-choice", ok: fc.ok, status: fc.status, ms: fc.ms });
  await advance("scale");
  await sleep(STEP_DWELL_MS);

  // scale → vote2
  await advance("vote2");
  await sleep(STEP_DWELL_MS);

  // vote2 → tally2 → ai_ladder_propose
  await tally("tally2");
  roomCtx.stateAdvancedAt["ai_ladder_propose"] = Date.now();
  await sleep(STEP_DWELL_MS);

  // ai_ladder_propose → ai-tally → ai_ladder
  await tally("ai-tally");
  roomCtx.stateAdvancedAt["ai_ladder"] = Date.now();
  await sleep(STEP_DWELL_MS);

  // ai_ladder → ai-tally → vote3
  await tally("ai-tally");
  roomCtx.stateAdvancedAt["vote3"] = Date.now();
  await sleep(STEP_DWELL_MS);

  // vote3 → ai-tally → pledge
  await tally("ai-tally");
  roomCtx.stateAdvancedAt["pledge"] = Date.now();

  // set pledge slot content so participants can respond
  for (let i = 1; i <= 4; i++) {
    await req("PATCH", `/api/rooms/${roomCode}/pledge`, {
      slot_index: i, content: `slot ${i}: describe your commitment to responsible ai use.`,
    });
  }
  await sleep(STEP_DWELL_MS);

  // pledge → pledge_vote
  await advance("pledge_vote");
  await sleep(STEP_DWELL_MS);

  // pledge_vote → tally-pledge → commit
  await tally("tally-pledge");
  roomCtx.stateAdvancedAt["commit"] = Date.now();
}

// ── per-room orchestration ────────────────────────────────────────────────────

async function runRoom(roomIdx, timings, overVoteTimings, syncLags) {
  // create room
  const create = await req("POST", "/api/rooms", {
    learning_outcome: `loadtest outcome ${roomIdx + 1}: apply threshold concepts under load`,
    project_description: `loadtest project ${roomIdx + 1}: a research report demonstrating conceptual understanding`,
  });
  timings.push({ op: "create", ok: create.ok, status: create.status, ms: create.ms });
  if (!create.ok || !create.json?.code) return { completed: false, code: null, joined: 0, dropped: 0 };

  const code = create.json.code;

  // join all participants
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
    participants.push({ participantId: r.value.json.participant_id, roomCode: code });
  }

  // randomly drop some participants
  let droppedCount = 0;
  for (const p of participants) {
    if (Math.random() < DROPOUT_RATE) {
      p.dropped = true;
      droppedCount++;
    }
  }

  const roomCtx = { stateAdvancedAt: {}, currentState: "lobby" };
  const stopFlag = { done: false };

  // run facilitator and participant poll loops concurrently
  const pollLoops = participants.map((p) =>
    runParticipant(p, roomCtx, timings, overVoteTimings, syncLags, stopFlag),
  );

  await Promise.allSettled([
    runFacilitator(code, roomCtx, timings).then(() => { stopFlag.done = true; }),
    ...pollLoops,
  ]);

  // verify final state
  const { json: final } = await req("GET", `/api/rooms/${code}`);
  const completed = final?.room?.state === "commit";
  return { completed, code, joined: participants.length, dropped: droppedCount };
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nRubric Co-Builder — full end-to-end load test`);
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`${ROOMS} rooms × ${PER_ROOM} participants = ${ROOMS * PER_ROOM} virtual users`);
  console.log(`dropout rate: ${(DROPOUT_RATE * 100).toFixed(0)}%   poll interval: ${POLL_INTERVAL_MS}ms   step dwell: ${STEP_DWELL_MS}ms`);
  console.log(`vote race probe: maxVotes + ${OVER_VOTE} concurrent per participant\n`);

  const allTimings = [];
  const overVoteTimings = [];
  const syncLags = [];

  const totalStart = performance.now();

  const roomResults = await Promise.allSettled(
    Array.from({ length: ROOMS }, (_, i) =>
      runRoom(i, allTimings, overVoteTimings, syncLags),
    ),
  );

  const totalMs = performance.now() - totalStart;

  // ── per-operation summary ────────────────────────────────────────────────
  console.log("── Per-operation latency ────────────────────────────────────────");
  const byOp = {};
  for (const t of allTimings) {
    if (!byOp[t.op]) byOp[t.op] = [];
    byOp[t.op].push(t);
  }
  for (const [op, ts] of Object.entries(byOp)) row(op, ts);

  if (overVoteTimings.length) {
    console.log("");
    console.log("── Vote race probe ──────────────────────────────────────────────");
    row("vote (within quota)", allTimings.filter((t) => t.op === "vote"));
    row("vote (over quota)",   overVoteTimings);
    const raced = overVoteTimings.filter((t) => t.status === 201).length;
    if (raced > 0) {
      console.log(`\n  !! TOCTOU CONFIRMED: ${raced} over-quota votes returned 201`);
    } else {
      console.log(`  over-quota votes: all 409 (no race at this concurrency)`);
    }
  }

  // ── sync lag ─────────────────────────────────────────────────────────────
  console.log("\n── Sync lag (PATCH → participant detects new state) ─────────────");
  const lagByState = {};
  for (const { state, lag } of syncLags) {
    if (!lagByState[state]) lagByState[state] = [];
    lagByState[state].push(lag);
  }
  for (const [state, lags] of Object.entries(lagByState)) {
    const all = lags.filter((l) => l >= 0);
    if (!all.length) continue;
    console.log(`  ${state.padEnd(22)}  n=${String(all.length).padStart(4)}  p50=${pct(all, 50)}  p95=${pct(all, 95)}  max=${pct(all, 100)}`);
  }

  // ── room completion ───────────────────────────────────────────────────────
  console.log("\n── Room outcomes ────────────────────────────────────────────────");
  let completed = 0, totalJoined = 0, totalDropped = 0;
  for (const r of roomResults) {
    if (r.status !== "fulfilled") continue;
    if (r.value.completed) completed++;
    totalJoined += r.value.joined ?? 0;
    totalDropped += r.value.dropped ?? 0;
  }
  const activeUsers = totalJoined - totalDropped;
  console.log(`  rooms reaching commit:  ${completed} / ${ROOMS}`);
  console.log(`  participants joined:    ${totalJoined} / ${ROOMS * PER_ROOM}`);
  console.log(`  participants dropped:   ${totalDropped}  (active: ${activeUsers})`);

  console.log(`\n  total wall time: ${(totalMs / 1000).toFixed(1)}s`);
  console.log("─────────────────────────────────────────────────────────────────\n");

  console.log("verification query (Neon test branch — confirms TOCTOU at DB level):");
  console.log(`
  select participant_id, round, count(*) as n
  from rubric_cobuilder.votes
  where participant_id in (
    select id from rubric_cobuilder.participants
    where room_id in (
      select id from rubric_cobuilder.rooms
      where learning_outcome like 'loadtest outcome%'
    )
  )
  group by 1, 2 having count(*) > 3;
`);

  process.exit(completed < ROOMS ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
