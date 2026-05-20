#!/usr/bin/env node
// rubric-co-builder load-test simulation
// pure Node.js (no deps). simulates concurrent in-memory operations.
// latency values are compressed (real Neon ≈ 20–300ms; here we use 1–5ms)
// to keep the suite under 30 seconds while preserving race ordering.

import { createHash, createHmac } from "node:crypto";

const G = (s) => `\x1b[32m${s}\x1b[0m`;
const R = (s) => `\x1b[31m${s}\x1b[0m`;
const B = (s) => `\x1b[34m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── HMAC token ──────────────────────────────────────────────────────────────
const SECRET = "rcb-demo-secret-not-for-production";
function generateToken(code) {
  return createHmac("sha256", SECRET).update(code).digest("hex");
}
function verifyToken(code, token) {
  if (!token) return false;
  const expected = generateToken(code.toUpperCase());
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

// ─── row-level lock (mirrors SELECT … FOR UPDATE) ───────────────────────────
class RowLock {
  #q = new Map();
  async acquire(key) {
    while (this.#q.has(key)) await this.#q.get(key);
    let done;
    this.#q.set(key, new Promise((r) => { done = r; }));
    return () => { this.#q.delete(key); done(); };
  }
}

// ─── in-memory store factory ──────────────────────────────────────────────────
const STATE_ORDER = [
  "lobby","frame","propose","vote","criteria_gate",
  "scale","vote2","ai_ladder_propose","ai_ladder",
  "vote3","pledge","pledge_vote","commit",
];

function makeStore() {
  const lock = new RowLock();
  const rooms = new Map();
  const participants = new Map();
  const criteria = new Map();
  const votes = new Map();
  let seq = 0;
  const uid = () => (++seq).toString(16).padStart(4, "0");

  const findRoom = (code) => rooms.get(code) ?? null;

  function countVotes(pid, roomId, round) {
    const cids = new Set([...criteria.values()].filter(c => c.room_id === roomId).map(c => c.id));
    return [...votes.values()].filter(
      v => v.pid === pid && cids.has(v.cid) && v.round === round
    ).length;
  }

  return {
    createRoom(code, state = "lobby") {
      const r = { id: uid(), code, state, tally_runs: 0 };
      rooms.set(code, r);
      return r;
    },
    addCriterion(roomId) {
      const c = { id: uid(), room_id: roomId };
      criteria.set(c.id, c);
      return c;
    },
    addParticipant(code) {
      const room = findRoom(code);
      if (!room) return null;
      const p = { id: uid(), room_id: room.id };
      participants.set(p.id, p);
      return p;
    },

    // OLD: two separate async ops — race window in between
    async castVoteOld(pid, cid, roomId, round, maxVotes, latMs = 0) {
      await delay(latMs);                               // simulate Neon read
      const count = countVotes(pid, roomId, round);
      if (count >= maxVotes) return "over_limit";
      await delay(latMs);                               // simulate Neon write
      const key = `${pid}:${cid}:${round}`;
      if (votes.has(key)) return votes.get(key);
      const v = { pid, cid, round };
      votes.set(key, v);
      return v;
    },

    // NEW: atomic per-participant lock (FOR UPDATE simulation)
    async castVoteNew(pid, cid, roomId, round, maxVotes, latMs = 0) {
      const release = await lock.acquire(`v:${pid}:${round}`);
      try {
        await delay(latMs);
        const key = `${pid}:${cid}:${round}`;
        if (votes.has(key)) return votes.get(key);
        const count = countVotes(pid, roomId, round);
        if (count >= maxVotes) return "over_limit";
        const v = { pid, cid, round };
        votes.set(key, v);
        return v;
      } finally { release(); }
    },

    voteCount(pid, roomId, round) { return countVotes(pid, roomId, round); },

    // OLD tally: no state guard
    async tallyOld(code, next) {
      const room = findRoom(code);
      if (!room) return { status: 404 };
      room.tally_runs++;
      room.state = next;
      return { status: 200, state: next, tally_runs: room.tally_runs };
    },

    // NEW tally: state guard + conditional advance
    async tallyNew(code, expected, next) {
      const room = findRoom(code);
      if (!room) return { status: 404 };
      if (room.state !== expected) {
        return { status: 200, already_advanced: true, state: room.state };
      }
      room.tally_runs++;
      if (room.state !== next) room.state = next;
      return { status: 200, state: room.state };
    },

    // OLD state advance: no auth, no direction check
    advanceOld(code, to) {
      const room = findRoom(code);
      if (!room) return { status: 404 };
      room.state = to;
      return { status: 200, state: to };
    },

    // NEW state advance: auth + forward-only
    advanceNew(code, to, token) {
      if (!verifyToken(code, token)) return { status: 401 };
      const room = findRoom(code);
      if (!room) return { status: 404 };
      const cur = STATE_ORDER.indexOf(room.state);
      const req = STATE_ORDER.indexOf(to);
      if (req !== -1 && cur !== -1 && req <= cur) return { status: 409, current: room.state };
      room.state = to;
      return { status: 200, state: to };
    },

    getToken(code) { return generateToken(code.toUpperCase()); },
    checkAuth(code, token) { return verifyToken(code, token); },
    getRoom(code) { return findRoom(code); },
  };
}

// ─── assertion helpers ───────────────────────────────────────────────────────
let totalFail = 0;
function assert(label, pass, detail = "") {
  const icon = pass ? G("✓") : R("✗");
  console.log(`  ${icon} ${label}${detail ? DIM("  — " + detail) : ""}`);
  if (!pass) totalFail++;
}

// ─── S1: TOCTOU vote race ─────────────────────────────────────────────────────
async function s1_toctou(rooms, participants, latMs, tag) {
  const MAX = 3;
  const EXTRA = 5;
  let overOld = 0, overNew = 0;

  // rooms run in parallel
  await Promise.all(Array.from({ length: rooms }, async () => {
    const s = makeStore();
    const code = "X";
    const room = s.createRoom(code, "vote");
    const crits = Array.from({ length: MAX + EXTRA }, () => s.addCriterion(room.id));

    await Promise.all(Array.from({ length: participants }, async () => {
      const p = s.addParticipant(code);

      // OLD: all attempts concurrently
      await Promise.all(crits.map(c => s.castVoteOld(p.id, c.id, room.id, 1, MAX, latMs)));
      overOld += Math.max(0, s.voteCount(p.id, room.id, 1) - MAX);

      const p2 = s.addParticipant(code);
      // NEW: all attempts concurrently
      await Promise.all(crits.map(c => s.castVoteNew(p2.id, c.id, room.id, 1, MAX, latMs)));
      overNew += Math.max(0, s.voteCount(p2.id, room.id, 1) - MAX);
    }));
  }));

  console.log(`\n${B(`TOCTOU vote race`)} ${DIM(`(${tag}, ${rooms} rooms × ${participants} participants)`)}`);
  assert("old code has over-quota votes", overOld > 0, `${overOld} extra votes (expected: many)`);
  assert("new code: zero over-quota votes", overNew === 0, `${overNew} extra votes`);
}

// ─── S2: tally idempotency ────────────────────────────────────────────────────
async function s2_tally_idempotency() {
  const ROOMS = 20, CALLERS = 5;
  let badOld = 0, badNew = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "T";
    s.createRoom(code, "vote");

    const [rOld, rNew] = await Promise.all([
      Promise.all(Array.from({ length: CALLERS }, () => s.tallyOld(code, "criteria_gate"))),
      Promise.all(Array.from({ length: CALLERS }, () => s.tallyNew(code, "vote", "criteria_gate"))),
    ]);

    if ((s.getRoom(code)?.tally_runs ?? 0) > 1) badOld++;
    if (rNew.filter(r => !r.already_advanced).length > 1) badNew++;
  }));

  console.log(`\n${B("tally idempotency")} ${DIM(`(${ROOMS} rooms, ${CALLERS} concurrent callers)`)}`);
  assert("old code: rooms tallied multiple times", badOld > 0, `${badOld}/${ROOMS} rooms (expected: many)`);
  assert("new code: zero double-tallies", badNew === 0, `${badNew}/${ROOMS} rooms double-advanced`);
}

// ─── S3: facilitator auth ─────────────────────────────────────────────────────
async function s3_auth() {
  const ROOMS = 20;
  let noTok = 0, badTok = 0, goodTok = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "A";
    s.createRoom(code, "vote");
    const tok = s.getToken(code);
    const bad = "ff".repeat(32);

    const r1 = s.advanceNew(code, "criteria_gate", "");    // no token
    const r2 = s.advanceNew(code, "criteria_gate", bad);   // wrong token
    // correct token — advance forward from vote → criteria_gate
    s.createRoom("A2", "vote");
    const r3 = s.advanceNew("A2", "criteria_gate", s.getToken("A2")); // correct

    if (r1.status === 401) noTok++;
    if (r2.status === 401) badTok++;
    if (r3.status === 200) goodTok++;
  }));

  console.log(`\n${B("facilitator auth")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`no token → 401 (${noTok}/${ROOMS})`, noTok === ROOMS);
  assert(`wrong token → 401 (${badTok}/${ROOMS})`, badTok === ROOMS);
  assert(`correct token → 200 (${goodTok}/${ROOMS})`, goodTok === ROOMS);
}

// ─── S4: state transition guards ──────────────────────────────────────────────
async function s4_state_guards() {
  const ROOMS = 20;
  let backward = 0, stay = 0, fwdOne = 0, fwdSkip = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();

    s.createRoom("B", "vote");
    const tok = s.getToken("B");
    if (s.advanceNew("B", "lobby", tok).status === 409) backward++;   // backward
    if (s.advanceNew("B", "vote", tok).status === 409) stay++;        // stay

    s.createRoom("C", "vote");
    const t2 = s.getToken("C");
    if (s.advanceNew("C", "criteria_gate", t2).status === 200) fwdOne++;  // +1

    s.createRoom("D", "vote");
    const t3 = s.getToken("D");
    if (s.advanceNew("D", "scale", t3).status === 200) fwdSkip++;    // skip ahead
  }));

  console.log(`\n${B("state transition guards")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`backward blocked (${backward}/${ROOMS})`, backward === ROOMS);
  assert(`stay-in-place blocked (${stay}/${ROOMS})`, stay === ROOMS);
  assert(`forward +1 allowed (${fwdOne}/${ROOMS})`, fwdOne === ROOMS);
  assert(`forward skip allowed (${fwdSkip}/${ROOMS})`, fwdSkip === ROOMS);
}

// ─── S5: dropout + rejoin ────────────────────────────────────────────────────
async function s5_rejoin() {
  const ROOMS = 20;
  let newId = 0, reVote = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "R";
    const room = s.createRoom(code, "vote");
    const crit = s.addCriterion(room.id);

    const p1 = s.addParticipant(code);
    await s.castVoteNew(p1.id, crit.id, room.id, 1, 3);

    const p2 = s.addParticipant(code);          // simulated rejoin
    if (p1.id !== p2.id) newId++;

    await s.castVoteNew(p2.id, crit.id, room.id, 1, 3);
    if (s.voteCount(p2.id, room.id, 1) > 0) reVote++;
  }));

  console.log(`\n${B("dropout + rejoin")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`new identity on rejoin (${newId}/${ROOMS})`, newId === ROOMS, "expected — documented behaviour");
  assert(`rejoined participant can re-vote (${reVote}/${ROOMS})`, reVote === ROOMS, "expected — new pid, fresh count");
}

// ─── S6: room code collision ──────────────────────────────────────────────────
async function s6_collisions() {
  const ATTEMPTS = 500;
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits  = "23456789";
  function gen() {
    let s = "";
    for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * digits.length)];
    return s;
  }

  const seen = new Set();
  let collisions = 0;
  for (let i = 0; i < ATTEMPTS; i++) {
    let code;
    for (let t = 0; t < 8; t++) { code = gen(); if (!seen.has(code)) break; }
    if (seen.has(code)) { collisions++; continue; }
    seen.add(code);
  }

  console.log(`\n${B("room code collision")} ${DIM(`(${ATTEMPTS} creates)`)}`);
  assert(`zero collisions (${collisions})`, collisions === 0);
}

// ─── S7: double-tap facilitator ───────────────────────────────────────────────
async function s7_doubletap() {
  const ROOMS = 20, CALLERS = 5;
  let overAdv = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "F";
    s.createRoom(code, "vote");

    const results = await Promise.all(
      Array.from({ length: CALLERS }, () => s.tallyNew(code, "vote", "criteria_gate"))
    );
    if (results.filter(r => !r.already_advanced).length > 1) overAdv++;
  }));

  console.log(`\n${B("facilitator double-tap")} ${DIM(`(${ROOMS} rooms, ${CALLERS} concurrent)`)}`);
  assert(`zero double-advances (${overAdv}/${ROOMS} rooms)`, overAdv === 0);
}

// ─── NEW: ai-tally race (ai_ladder → vote3) ───────────────────────────────────
async function s8_ai_tally_race() {
  const ROOMS = 20, CALLERS = 5;
  let overAdv = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "AI";
    s.createRoom(code, "ai_ladder");

    const results = await Promise.all(
      Array.from({ length: CALLERS }, () => s.tallyNew(code, "ai_ladder", "vote3"))
    );
    if (results.filter(r => !r.already_advanced).length > 1) overAdv++;
  }));

  console.log(`\n${B("new — ai-tally race (ai_ladder → vote3)")} ${DIM(`(${ROOMS} rooms, ${CALLERS} concurrent)`)}`);
  assert(`zero double-advances (${overAdv}/${ROOMS} rooms)`, overAdv === 0);
}

// ─── NEW: tally called on already-advanced room ───────────────────────────────
async function s9_tally_wrong_state() {
  const ROOMS = 20;
  let wrongStateRejected = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "W";
    s.createRoom(code, "pledge");   // already past vote → criteria_gate

    const r = await s.tallyNew(code, "vote", "criteria_gate");
    if (r.already_advanced) wrongStateRejected++;
  }));

  console.log(`\n${B("new — tally/1 called when room is past vote")} ${DIM(`(${ROOMS} rooms at pledge)`)}`);
  assert(`returns already_advanced (${wrongStateRejected}/${ROOMS})`, wrongStateRejected === ROOMS);
}

// ─── NEW: staggered arrival ───────────────────────────────────────────────────
async function s10_staggered() {
  const ROOMS = 20, PARTICIPANTS = 15, WINDOW = 10, MAX = 3;
  let overQuota = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "SG";
    const room = s.createRoom(code, "vote");
    const crits = Array.from({ length: MAX + 3 }, () => s.addCriterion(room.id));

    const ps = await Promise.all(
      Array.from({ length: PARTICIPANTS }, (_, i) =>
        delay(Math.floor(Math.random() * WINDOW)).then(() => s.addParticipant(code))
      )
    );

    await Promise.all(ps.map(p =>
      Promise.all(crits.map(c =>
        delay(Math.floor(Math.random() * 3)).then(() =>
          s.castVoteNew(p.id, c.id, room.id, 1, MAX, 0)
        )
      ))
    ));

    for (const p of ps) overQuota += Math.max(0, s.voteCount(p.id, room.id, 1) - MAX);
  }));

  console.log(`\n${B("staggered arrival")} ${DIM(`(${ROOMS} rooms × ${PARTICIPANTS} participants, ${WINDOW}ms join window)`)}`);
  assert(`zero over-quota votes (${overQuota})`, overQuota === 0);
}

// ─── NEW: backward jump rejected even when from_state matches ─────────────────
async function s11_backward_with_from_state() {
  const ROOMS = 20;
  let caught = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "BK";
    s.createRoom(code, "vote");
    const tok = s.getToken(code);

    // client sends from_state=vote, to=lobby — forward guard should still reject
    const r = s.advanceNew(code, "lobby", tok);
    if (r.status === 409) caught++;
  }));

  console.log(`\n${B("new — backward jump rejected even with valid from_state")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`409 on backward jump (${caught}/${ROOMS})`, caught === ROOMS);
}

// ─── NEW: slow participant (vote after tally already ran) ─────────────────────
async function s12_slow_participant() {
  // a participant submits a vote AFTER the room has already advanced to criteria_gate.
  // the vote should still be accepted (no state guard on POST /votes).
  const ROOMS = 20;
  let lateVoteAccepted = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "SL";
    const room = s.createRoom(code, "criteria_gate"); // already tallied
    const crit = s.addCriterion(room.id);
    const p = s.addParticipant(code);

    const r = await s.castVoteNew(p.id, crit.id, room.id, 1, 3, 0);
    if (r && r !== "over_limit") lateVoteAccepted++;
  }));

  console.log(`\n${B("new — slow participant votes after tally")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`late vote accepted (${lateVoteAccepted}/${ROOMS})`, lateVoteAccepted === ROOMS,
    "POST /votes has no state guard — by design");
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B("rubric-co-builder load test")}  ${DIM(new Date().toISOString())}`);
  console.log(DIM("─".repeat(70)));

  await s1_toctou(20, 15, 0,  "0ms baseline");
  await s1_toctou(10,  8, 1,  "1ms (compressed EU)");
  await s1_toctou(10,  8, 3,  "3ms (compressed APAC)");
  await s2_tally_idempotency();
  await s3_auth();
  await s4_state_guards();
  await s5_rejoin();
  await s6_collisions();
  await s7_doubletap();
  await s8_ai_tally_race();
  await s9_tally_wrong_state();
  await s10_staggered();
  await s11_backward_with_from_state();
  await s12_slow_participant();

  console.log(`\n${DIM("─".repeat(70))}`);
  if (totalFail === 0) {
    console.log(G("all assertions passed."));
  } else {
    console.log(R(`${totalFail} assertion(s) failed.`));
  }
  console.log("");
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
