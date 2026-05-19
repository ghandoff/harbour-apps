/**
 * Load test: Rubric Co-Builder — 20 rooms × 15 participants (300 concurrent)
 *
 * Phases:
 *   1. create rooms  — 20 × POST /api/rooms
 *   2. join          — 300 × POST /api/rooms/[code]/join (concurrent burst)
 *   3. poll          — 300 × GET  /api/rooms/[code] (baseline snapshot latency)
 *   4. propose       — rooms advance to "propose"; each participant proposes one criterion
 *   5. vote          — rooms advance to "vote"; each participant fires maxVotes+OVER_VOTE
 *                      concurrent requests to probe the TOCTOU race in votes/route.ts
 *
 * Usage (from monorepo root):
 *   node load-tests/rubric-co-builder.mjs
 *
 * Env overrides:
 *   BASE_URL=http://localhost:3030   (default)
 *   ROOMS=20
 *   PER_ROOM=15
 *   OVER_VOTE=1   extra votes beyond maxVotes to fire for race probing (default 1)
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3030";
const ROOMS = Number(process.env.ROOMS) || 20;
const PER_ROOM = Number(process.env.PER_ROOM) || 15;
const OVER_VOTE = Number(process.env.OVER_VOTE) || 1;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── timing helpers ────────────────────────────────────────────────────────────

function pct(arr, p) {
  if (!arr.length) return "N/A";
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = p >= 100 ? sorted.length - 1 : Math.floor((sorted.length * p) / 100);
  return sorted[idx].toFixed(0) + "ms";
}

function summarise(label, timings) {
  const ok = timings.filter((t) => t.ok);
  const failed = timings.filter((t) => !t.ok);
  const ms = ok.map((t) => t.ms);
  const failedStatuses = failed.reduce((acc, t) => {
    const key = t.status ? String(t.status) : "network";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const failStr = failed.length
    ? `  failed=${failed.length} (${JSON.stringify(failedStatuses)})`
    : "";
  console.log(
    `  ${label.padEnd(16)}` +
      `  ok=${String(ok.length).padStart(4)}${failStr}` +
      (ms.length
        ? `  p50=${pct(ms, 50)}  p95=${pct(ms, 95)}  p99=${pct(ms, 99)}  max=${pct(ms, 100)}`
        : ""),
  );
  return { ok: ok.length, failed: failed.length, failedStatuses, ms };
}

// ── http helper ───────────────────────────────────────────────────────────────

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

// ── phase 1: create rooms ─────────────────────────────────────────────────────

async function phase1CreateRooms() {
  console.log(`\nphase 1 — create ${ROOMS} rooms`);
  const results = await Promise.allSettled(
    Array.from({ length: ROOMS }, (_, i) =>
      req("POST", "/api/rooms", {
        learning_outcome: `loadtest outcome ${i + 1}: apply threshold concepts under load`,
        project_description: `loadtest project ${i + 1}: a research report demonstrating conceptual understanding`,
      }),
    ),
  );
  const rooms = [];
  const timings = [];
  for (const r of results) {
    if (r.status !== "fulfilled") { timings.push({ ok: false, status: 0, ms: 0 }); continue; }
    const { ok, status, ms, json } = r.value;
    timings.push({ ok, status, ms });
    if (ok && json?.code) rooms.push(json.code);
  }
  summarise("POST /rooms", timings);
  if (rooms.length < ROOMS) {
    console.error(`  only ${rooms.length}/${ROOMS} rooms created — aborting`);
    process.exit(1);
  }
  return rooms;
}

// ── phase 2: join ─────────────────────────────────────────────────────────────

async function phase2Join(rooms) {
  console.log(`\nphase 2 — join (${ROOMS * PER_ROOM} participants, ${PER_ROOM}/room)`);

  const results = await Promise.allSettled(
    rooms.flatMap((code) =>
      Array.from({ length: PER_ROOM }, () => req("POST", `/api/rooms/${code}/join`)),
    ),
  );
  const participants = [];
  const timings = [];
  for (let i = 0; i < results.length; i++) {
    const code = rooms[Math.floor(i / PER_ROOM)];
    const r = results[i];
    if (r.status !== "fulfilled") { timings.push({ ok: false, status: 0, ms: 0 }); continue; }
    const { ok, status, ms, json } = r.value;
    timings.push({ ok, status, ms });
    if (ok && json?.participant_id) participants.push({ roomCode: code, participantId: json.participant_id });
  }
  summarise("POST /join", timings);
  if (participants.length < ROOMS * PER_ROOM) {
    console.warn(`  warning: only ${participants.length}/${ROOMS * PER_ROOM} participants joined`);
  }
  return participants;
}

// ── phase 3: poll ─────────────────────────────────────────────────────────────

async function phase3Poll(rooms, label) {
  const results = await Promise.allSettled(
    rooms.flatMap((code) =>
      Array.from({ length: PER_ROOM }, () => req("GET", `/api/rooms/${code}`)),
    ),
  );
  const timings = results.map((r) =>
    r.status === "fulfilled"
      ? { ok: r.value.ok, status: r.value.status, ms: r.value.ms }
      : { ok: false, status: 0, ms: 0 },
  );
  return summarise(label ?? "GET /rooms", timings);
}

// ── phase 4: propose ──────────────────────────────────────────────────────────

async function phase4Propose(rooms, participants) {
  console.log(`\nphase 4 — propose (advance to "propose"; each participant proposes 1 criterion)`);

  await Promise.allSettled(
    rooms.map((code) => req("PATCH", `/api/rooms/${code}`, { state: "propose" })),
  );

  const results = await Promise.allSettled(
    participants.map((p, i) =>
      req("POST", `/api/rooms/${p.roomCode}/criteria`, {
        name: `criterion ${i + 1}`,
        good_description: "the work clearly demonstrates understanding of the core concept.",
      }),
    ),
  );
  const timings = results.map((r) =>
    r.status === "fulfilled"
      ? { ok: r.value.ok, status: r.value.status, ms: r.value.ms }
      : { ok: false, status: 0, ms: 0 },
  );
  summarise("POST /criteria", timings);

  // re-fetch snapshots to capture all criteria IDs (seeds + proposed)
  const snaps = await Promise.all(rooms.map((code) => req("GET", `/api/rooms/${code}`)));
  const criteriaByRoom = {};
  for (let i = 0; i < rooms.length; i++) {
    criteriaByRoom[rooms[i]] = snaps[i]?.json?.criteria?.map((c) => c.id) ?? [];
  }
  return criteriaByRoom;
}

// ── phase 5: vote burst ───────────────────────────────────────────────────────

async function phase5Vote(rooms, participants, criteriaByRoom) {
  console.log(`\nphase 5 — vote burst (advance to "vote"; fire maxVotes+${OVER_VOTE} concurrent per participant)`);

  await Promise.allSettled(
    rooms.map((code) => req("PATCH", `/api/rooms/${code}`, { state: "vote" })),
  );

  // brief pause so all state updates are visible before the burst
  await sleep(200);

  const withinTimings = [];
  const overTimings = [];

  await Promise.allSettled(
    participants.flatMap((p) => {
      const criteria = criteriaByRoom[p.roomCode] ?? [];
      if (!criteria.length) return [];
      const ballotSize = criteria.length;
      const maxVotes = Math.min(3, Math.max(1, ballotSize - 1));
      const toCast = Math.min(maxVotes + OVER_VOTE, criteria.length);

      return criteria.slice(0, toCast).map((cid, idx) =>
        req("POST", `/api/rooms/${p.roomCode}/votes`, {
          participant_id: p.participantId,
          criterion_id: cid,
          round: 1,
        }).then(({ ok, status, ms }) => {
          const t = { ok, status, ms };
          if (idx < maxVotes) withinTimings.push(t);
          else overTimings.push(t);
        }),
      );
    }),
  );

  summarise("POST /votes (quota)", withinTimings);

  if (overTimings.length) {
    summarise("POST /votes (over)", overTimings);
    const racedThrough = overTimings.filter((t) => t.status === 201).length;
    if (racedThrough > 0) {
      console.log(
        `\n  !! TOCTOU RACE CONFIRMED: ${racedThrough} over-quota votes returned 201` +
          ` (should all be 409)`,
      );
    } else {
      console.log(`  over-quota votes: ${overTimings.length} total — all returned 409 (no race at this concurrency)`);
    }
    return { withinTimings, overTimings, racedThrough };
  }
  return { withinTimings, overTimings, racedThrough: 0 };
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nRubric Co-Builder load test`);
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`${ROOMS} rooms × ${PER_ROOM} participants = ${ROOMS * PER_ROOM} virtual users`);
  console.log(`vote probe: maxVotes + ${OVER_VOTE} concurrent requests per participant\n`);

  const totalStart = performance.now();

  const rooms = await phase1CreateRooms();
  const participants = await phase2Join(rooms);

  console.log(`\nphase 3 — poll baseline (${ROOMS * PER_ROOM} GET /rooms/[code])`);
  const baseline = await phase3Poll(rooms, "GET /rooms");

  const criteriaByRoom = await phase4Propose(rooms, participants);

  // run phase 5 and a concurrent poll to measure latency under write pressure
  let pollBurstStats = null;
  const [voteResult] = await Promise.all([
    phase5Vote(rooms, participants, criteriaByRoom),
    (async () => {
      await sleep(50); // let vote burst start first
      console.log(`\nphase 3b — poll during vote burst (${ROOMS * PER_ROOM} requests)`);
      pollBurstStats = await phase3Poll(rooms, "GET /rooms");
    })(),
  ]);

  const totalMs = performance.now() - totalStart;

  console.log("\n── Summary ──────────────────────────────────────────────────────");
  console.log(`total wall time:       ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`participants joined:   ${participants.length} / ${ROOMS * PER_ROOM}`);
  console.log(`TOCTOU races:          ${voteResult.racedThrough}`);
  console.log("");
  console.log(`poll p95 — baseline: ${pct(baseline.ms, 95)}  during vote burst: ${pct(pollBurstStats?.ms ?? [], 95)}`);
  console.log("─────────────────────────────────────────────────────────────────\n");

  console.log("verification query (run against test branch to confirm TOCTOU):");
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

  // exit 1 only on unexpected failures (exclude anticipated 409s on over-quota votes)
  const unexpected =
    voteResult.withinTimings.filter((t) => !t.ok && t.status !== 409).length +
    voteResult.overTimings.filter((t) => !t.ok && t.status !== 409 && t.status !== 201).length;
  process.exit(unexpected > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
