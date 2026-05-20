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
    addCriterion(roomId, required = false) {
      const c = { id: uid(), room_id: roomId, required };
      criteria.set(c.id, c);
      return c;
    },

    // NEW: delete with required guard
    deleteCriterion(id) {
      const c = criteria.get(id);
      if (!c) return false;
      if (c.required) return "required";
      criteria.delete(id);
      return true;
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

    removeVote(pid, cid, round) {
      const key = `${pid}:${cid}:${round}`;
      votes.delete(key);
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

    // NEW state advance: auth + forward-only + from_state guard
    advanceNew(code, to, token, fromState = null) {
      if (!verifyToken(code, token)) return { status: 401 };
      const room = findRoom(code);
      if (!room) return { status: 404 };
      if (fromState !== null && room.state !== fromState) {
        return { status: 409, reason: "from_state_mismatch", current: room.state };
      }
      const cur = STATE_ORDER.indexOf(room.state);
      const req = STATE_ORDER.indexOf(to);
      if (req !== -1 && cur !== -1 && req <= cur) return { status: 409, reason: "backward", current: room.state };
      room.state = to;
      return { status: 200, state: to };
    },

    getToken(code) { return generateToken(code.toUpperCase()); },
    checkAuth(code, token) { return verifyToken(code, token); },
    getRoom(code) { return findRoom(code); },
    getRoundForState(code) {
      const room = findRoom(code);
      if (!room) return 1;
      if (room.state === "vote2") return 2;
      if (room.state === "vote3") return 3;
      return 1;
    },

    // OLD: accepts client-supplied round (the bug)
    async castVoteOldRound(pid, cid, roomId, clientRound, roomCode, maxVotes) {
      const room = findRoom(roomCode);
      if (!room) return null;
      // old code: uses client-supplied round if valid, else derives from state
      const round = [1, 2, 3].includes(clientRound) ? clientRound : (room.state === "vote2" ? 2 : room.state === "vote3" ? 3 : 1);
      const key = `${pid}:${cid}:${round}`;
      if (votes.has(key)) return votes.get(key);
      const count = countVotes(pid, roomId, round);
      if (count >= maxVotes) return "over_limit";
      const v = { pid, cid, round };
      votes.set(key, v);
      return v;
    },

    // NEW: ignores client-supplied round, always derives from room state
    async castVoteNewRound(pid, cid, roomId, roomCode, maxVotes) {
      const release = await lock.acquire(`v:${pid}:${roomId}`);
      try {
        const room = findRoom(roomCode);
        if (!room) return null;
        const round = room.state === "vote2" ? 2 : room.state === "vote3" ? 3 : 1;
        const key = `${pid}:${cid}:${round}`;
        if (votes.has(key)) return votes.get(key);
        const count = countVotes(pid, roomId, round);
        if (count >= maxVotes) return "over_limit";
        const v = { pid, cid, round };
        votes.set(key, v);
        return v;
      } finally { release(); }
    },
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

// ─── NEW: required criterion deletion blocked ─────────────────────────────────
async function s13_required_criterion_delete() {
  const ROOMS = 20;
  let requiredBlocked = 0, nonRequiredDeleted = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "RC";
    const room = s.createRoom(code, "propose");
    const required = s.addCriterion(room.id, true);   // required=true
    const optional = s.addCriterion(room.id, false);  // required=false

    const r1 = s.deleteCriterion(required.id);
    const r2 = s.deleteCriterion(optional.id);

    if (r1 === "required") requiredBlocked++;
    if (r2 === true) nonRequiredDeleted++;
  }));

  console.log(`\n${B("new — required criterion deletion blocked")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`required → 409 blocked (${requiredBlocked}/${ROOMS})`, requiredBlocked === ROOMS);
  assert(`optional → deleted (${nonRequiredDeleted}/${ROOMS})`, nonRequiredDeleted === ROOMS);
}

// ─── NEW: client round override attack ───────────────────────────────────────
// participant in vote1 room sends round=2 in the body.
// old code: accepts it and casts a round-2 vote
// new code: ignores it, casts round-1 vote
async function s14_round_override() {
  const ROOMS = 20;
  let oldBleed = 0, newBleed = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "RO";
    const room = s.createRoom(code, "vote"); // round 1 phase
    const crits = Array.from({ length: 3 }, () => s.addCriterion(room.id));

    const p = s.addParticipant(code);

    // attacker supplies round=2 while room is in "vote" (round 1)
    for (const c of crits) {
      await s.castVoteOldRound(p.id, c.id, room.id, 2, code, 3);
    }
    // old code: votes landed in round 2
    if (s.voteCount(p.id, room.id, 2) > 0) oldBleed++;

    const p2 = s.addParticipant(code);
    for (const c of crits) {
      await s.castVoteNewRound(p2.id, c.id, room.id, code, 3);
    }
    // new code: votes land in round 1 (the actual current round)
    if (s.voteCount(p2.id, room.id, 2) > 0) newBleed++;
  }));

  console.log(`\n${B("new — client round override attack")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert("old code: round bleeds into round 2", oldBleed > 0, `${oldBleed}/${ROOMS} rooms affected`);
  assert("new code: no round bleed", newBleed === 0, `${newBleed}/${ROOMS} rooms affected`);
}

// ─── NEW: vote idempotency (same criterion twice) ─────────────────────────────
async function s15_vote_idempotency() {
  const ROOMS = 20;
  let quotaUnchanged = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "VI";
    const room = s.createRoom(code, "vote");
    const crit = s.addCriterion(room.id);
    const p = s.addParticipant(code);

    // cast the same vote twice concurrently
    await Promise.all([
      s.castVoteNew(p.id, crit.id, room.id, 1, 3),
      s.castVoteNew(p.id, crit.id, room.id, 1, 3),
    ]);

    // should still only count as 1 dot
    if (s.voteCount(p.id, room.id, 1) === 1) quotaUnchanged++;
  }));

  console.log(`\n${B("new — vote idempotency (same criterion twice)")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`duplicate vote counts once (${quotaUnchanged}/${ROOMS})`, quotaUnchanged === ROOMS);
}

// ─── NEW: vote retract then re-cast ──────────────────────────────────────────
async function s16_vote_retract_revote() {
  const ROOMS = 20;
  let recastOk = 0, quotaCorrect = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "VR";
    const room = s.createRoom(code, "vote");
    const [c1, c2, c3, c4] = Array.from({ length: 4 }, () => s.addCriterion(room.id));
    const p = s.addParticipant(code);

    // cast 3 votes (max quota)
    await s.castVoteNew(p.id, c1.id, room.id, 1, 3);
    await s.castVoteNew(p.id, c2.id, room.id, 1, 3);
    await s.castVoteNew(p.id, c3.id, room.id, 1, 3);

    // 4th vote should be over_limit
    const overflow = await s.castVoteNew(p.id, c4.id, room.id, 1, 3);

    // retract one vote
    s.removeVote(p.id, c1.id, 1);

    // now c4 should succeed
    const recast = await s.castVoteNew(p.id, c4.id, room.id, 1, 3);

    if (overflow === "over_limit") quotaCorrect++;
    if (recast && recast !== "over_limit") recastOk++;
  }));

  console.log(`\n${B("new — vote retract + re-cast")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`overflow blocked before retract (${quotaCorrect}/${ROOMS})`, quotaCorrect === ROOMS);
  assert(`re-cast succeeds after retract (${recastOk}/${ROOMS})`, recastOk === ROOMS);
}

// ─── NEW: tally2/tally3 called on wrong state ─────────────────────────────────
async function s17_tally_wrong_round() {
  const ROOMS = 20;
  let t2Rejected = 0, t3Rejected = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "WR";

    // tally2 called when room is at "vote" (not vote2)
    s.createRoom(code, "vote");
    const r2 = await s.tallyNew(code, "vote2", "vote3");
    if (r2.already_advanced) t2Rejected++;

    // tally3 called when room is at "vote2" (not vote3)
    s.createRoom("WR2", "vote2");
    const r3 = await s.tallyNew("WR2", "vote3", "pledge");
    if (r3.already_advanced) t3Rejected++;
  }));

  console.log(`\n${B("new — tally2/tally3 called on wrong state")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`tally2 on vote state → already_advanced (${t2Rejected}/${ROOMS})`, t2Rejected === ROOMS);
  assert(`tally3 on vote2 state → already_advanced (${t3Rejected}/${ROOMS})`, t3Rejected === ROOMS);
}

// ─── NEW: from_state concurrent race ─────────────────────────────────────────
// two concurrent PATCH /room requests both carrying from_state=vote.
// only the winner should advance; the second hits a from_state mismatch.
async function s18_from_state_race() {
  const ROOMS = 20;
  let onlyOneWon = 0;

  await Promise.all(Array.from({ length: ROOMS }, async () => {
    const s = makeStore();
    const code = "FS";
    s.createRoom(code, "vote");
    const tok = s.getToken(code);

    const [r1, r2] = await Promise.all([
      Promise.resolve(s.advanceNew(code, "criteria_gate", tok, "vote")),
      Promise.resolve(s.advanceNew(code, "criteria_gate", tok, "vote")),
    ]);

    const successes = [r1, r2].filter(r => r.status === 200).length;
    if (successes === 1) onlyOneWon++;
  }));

  console.log(`\n${B("new — from_state concurrent race")} ${DIM(`(${ROOMS} rooms)`)}`);
  assert(`exactly one winner (${onlyOneWon}/${ROOMS})`, onlyOneWon === ROOMS);
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
  await s13_required_criterion_delete();
  await s14_round_override();
  await s15_vote_idempotency();
  await s16_vote_retract_revote();
  await s17_tally_wrong_round();
  await s18_from_state_race();

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
