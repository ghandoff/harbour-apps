import { describe, it, expect } from 'vitest';
import { initialSession, reduce, CONSTANTS } from '../src/state/reducers.js';
import type { Action, Session } from '../src/state/types.js';

function setup(): Session {
  let s = initialSession('DEMO', 'fac-1', 1000);
  s = reduce(s, { type: 'joinParticipant', participantId: 'p1', displayName: 'alex', at: 1100 });
  s = reduce(s, { type: 'joinParticipant', participantId: 'p2', displayName: 'rae', at: 1200 });
  s = reduce(s, {
    type: 'assignTeams',
    assignments: [
      { teamId: 't1', name: 'team cadet', colour: 'cadet', startupId: 'ethos', participantIds: ['p1'] },
      { teamId: 't2', name: 'team redwood', colour: 'redwood', startupId: 'opened', participantIds: ['p2'] },
    ],
    at: 1300,
  });
  s = reduce(s, { type: 'advanceAct', to: 'auction', at: 1400 });
  s = reduce(s, { type: 'startAuction', valueId: 'radical-transparency', durationMs: 30_000, at: 1500 });
  return s;
}

describe('reducers', () => {
  it('creates session with initial state', () => {
    const s = initialSession('CODE', 'fac', 0);
    expect(s.id).toBe('CODE');
    expect(s.currentAct).toBe('arrival');
    expect(s.valueDeck.length).toBeGreaterThan(0);
    expect(s.events[0].type).toBe('sessionCreated');
  });

  it('adds unique participants only', () => {
    let s = initialSession('x', 'f', 0);
    s = reduce(s, { type: 'joinParticipant', participantId: 'p1', displayName: 'a', at: 1 });
    s = reduce(s, { type: 'joinParticipant', participantId: 'p1', displayName: 'a', at: 2 });
    expect(s.participants.length).toBe(1);
  });

  it('teams start with START_CREDOS', () => {
    const s = setup();
    expect(s.teams[0].credos).toBe(CONSTANTS.START_CREDOS);
    expect(s.teams[1].credos).toBe(CONSTANTS.START_CREDOS);
  });

  it('rejects bid below current high', () => {
    let s = setup();
    s = reduce(s, { type: 'placeBid', teamId: 't1', amount: 10, at: 1600 });
    const bidCount1 = s.currentAuction?.highBid?.amount;
    s = reduce(s, { type: 'placeBid', teamId: 't2', amount: 10, at: 1700 });
    expect(s.currentAuction?.highBid?.amount).toBe(bidCount1);
    s = reduce(s, { type: 'placeBid', teamId: 't2', amount: 11, at: 1800 });
    expect(s.currentAuction?.highBid?.amount).toBe(11);
  });

  it('rejects bid above credos', () => {
    let s = setup();
    s = reduce(s, { type: 'placeBid', teamId: 't1', amount: 200, at: 1600 });
    expect(s.currentAuction?.highBid).toBeUndefined();
  });

  it('locks in deducts credos from winner only', () => {
    let s = setup();
    s = reduce(s, { type: 'placeBid', teamId: 't1', amount: 40, at: 1600 });
    s = reduce(s, { type: 'lockIn', at: 1700 });
    const t1 = s.teams.find((t) => t.id === 't1')!;
    const t2 = s.teams.find((t) => t.id === 't2')!;
    expect(t1.credos).toBe(CONSTANTS.START_CREDOS - 40);
    expect(t2.credos).toBe(CONSTANTS.START_CREDOS);
    expect(t1.wonValues).toContain('radical-transparency');
  });

  it('credos never go negative', () => {
    let s = setup();
    s = reduce(s, { type: 'placeBid', teamId: 't1', amount: 150, at: 1600 });
    s = reduce(s, { type: 'lockIn', at: 1700 });
    const t1 = s.teams.find((t) => t.id === 't1')!;
    expect(t1.credos).toBeGreaterThanOrEqual(0);
  });

  it('act advance resets the timer', () => {
    let s = initialSession('x', 'f', 0);
    s = reduce(s, { type: 'advanceAct', to: 'grouping', at: 500 });
    expect(s.actStartedAt).toBe(500);
    s = reduce(s, { type: 'advanceAct', to: 'scene', at: 900 });
    expect(s.actStartedAt).toBe(900);
  });

  it('value deck shrinks after lock-in', () => {
    let s = setup();
    const initialLen = s.valueDeck.length;
    s = reduce(s, { type: 'placeBid', teamId: 't1', amount: 5, at: 1600 });
    s = reduce(s, { type: 'lockIn', at: 1700 });
    expect(s.valueDeck.length).toBe(initialLen - 1);
    expect(s.valueDeck).not.toContain('radical-transparency');
  });

  it('no-bid lockin removes value without awarding', () => {
    let s = setup();
    s = reduce(s, { type: 'lockIn', at: 2000 });
    const completed = s.completedAuctions[0];
    expect(completed.winnerTeamId).toBeUndefined();
    expect(s.valueDeck).not.toContain('radical-transparency');
  });

  it('write purpose stores on team', () => {
    let s = setup();
    s = reduce(s, { type: 'writePurpose', teamId: 't1', statement: 'we exist to test', at: 2000 });
    const t1 = s.teams.find((t) => t.id === 't1')!;
    expect(t1.purposeStatement).toBe('we exist to test');
  });

  it('extend act adds ms', () => {
    let s = initialSession('x', 'f', 0);
    const before = s.actDurationMs;
    s = reduce(s, { type: 'extendAct', addMs: 30_000, at: 100 });
    expect(s.actDurationMs).toBe(before + 30_000);
  });

  it('every action appends an event', () => {
    let s = initialSession('x', 'f', 0);
    const before = s.events.length;
    const actions: Action[] = [
      { type: 'joinParticipant', participantId: 'p1', displayName: 'n', at: 1 },
      { type: 'advanceAct', to: 'grouping', at: 2 },
      { type: 'broadcast', message: 'hi', at: 3 },
    ];
    for (const a of actions) s = reduce(s, a);
    expect(s.events.length).toBe(before + actions.length);
  });
});
