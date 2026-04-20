import type { Action, Session, SessionEvent, SessionEventType, Team } from './types.js';
import { VALUES } from '../content/values.js';
import { ACTS, getAct, nextAct } from '../content/acts.js';

const START_CREDOS = 150;
const MIN_BID_INCREMENT = 1;

export function initialSession(id: string, facilitatorId: string, at: number): Session {
  return {
    id,
    createdAt: at,
    facilitatorId,
    currentAct: 'arrival',
    actDurationMs: getAct('arrival').durationMs,
    teams: [],
    participants: [],
    valueDeck: VALUES.map((v) => v.id),
    completedAuctions: [],
    events: [
      makeEvent('sessionCreated', at, { sessionId: id, facilitatorId }),
    ],
  };
}

function makeEvent(type: SessionEventType, at: number, payload: Record<string, unknown>): SessionEvent {
  return {
    id: `${at}-${type}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    type,
    payload,
  };
}

function pushEvent(session: Session, type: SessionEventType, at: number, payload: Record<string, unknown>): Session {
  return { ...session, events: [...session.events, makeEvent(type, at, payload)] };
}

export function reduce(state: Session, action: Action): Session {
  switch (action.type) {
    case 'createSession':
      return initialSession(action.sessionId, action.facilitatorId, action.at);

    case 'joinParticipant': {
      if (state.participants.some((p) => p.id === action.participantId)) return state;
      const p = {
        id: action.participantId,
        displayName: action.displayName,
        teamId: null,
        joinedAt: action.at,
        lastSeenAt: action.at,
      };
      const next = { ...state, participants: [...state.participants, p] };
      return pushEvent(next, 'participantJoined', action.at, { participantId: p.id, displayName: p.displayName });
    }

    case 'chooseArchetype': {
      const participants = state.participants.map((p) =>
        p.id === action.participantId ? { ...p, archetype: action.archetype, lastSeenAt: action.at } : p,
      );
      const next = { ...state, participants };
      return pushEvent(next, 'archetypeChosen', action.at, { participantId: action.participantId, archetype: action.archetype });
    }

    case 'assignTeams': {
      const teams: Team[] = action.assignments.map((a) => ({
        id: a.teamId,
        name: a.name,
        colour: a.colour,
        startupId: a.startupId,
        credos: START_CREDOS,
        intentions: {},
        softCeilings: {},
        wonValues: [],
      }));
      const assignmentByPid = new Map<string, string>();
      for (const a of action.assignments) {
        for (const pid of a.participantIds) assignmentByPid.set(pid, a.teamId);
      }
      const participants = state.participants.map((p) => {
        const tid = assignmentByPid.get(p.id);
        return tid ? { ...p, teamId: tid } : p;
      });
      const next = { ...state, teams, participants };
      return pushEvent(next, 'teamAssigned', action.at, { assignments: action.assignments });
    }

    case 'advanceAct': {
      const to = action.to;
      const def = getAct(to);
      const next = {
        ...state,
        currentAct: to,
        actStartedAt: action.at,
        actDurationMs: def.durationMs,
        startedAt: state.startedAt ?? action.at,
      };
      return pushEvent(next, 'actAdvanced', action.at, { to, from: state.currentAct });
    }

    case 'extendAct': {
      const next = { ...state, actDurationMs: state.actDurationMs + action.addMs };
      return pushEvent(next, 'facilitatorExtended', action.at, { addMs: action.addMs });
    }

    case 'pauseSession': {
      const next = { ...state, paused: action.paused };
      return pushEvent(next, 'facilitatorPaused', action.at, { paused: action.paused });
    }

    case 'setIntention': {
      const teams = state.teams.map((t) =>
        t.id === action.teamId
          ? { ...t, intentions: { ...t.intentions, [action.valueId]: action.zone } }
          : t,
      );
      const next = { ...state, teams };
      return pushEvent(next, 'intentionSet', action.at, {
        teamId: action.teamId,
        valueId: action.valueId,
        zone: action.zone,
      });
    }

    case 'setSoftCeiling': {
      const amount = Math.max(0, Math.floor(action.amount));
      const teams = state.teams.map((t) =>
        t.id === action.teamId
          ? { ...t, softCeilings: { ...t.softCeilings, [action.valueId]: amount } }
          : t,
      );
      const next = { ...state, teams };
      return pushEvent(next, 'softCeilingSet', action.at, {
        teamId: action.teamId,
        valueId: action.valueId,
        amount,
      });
    }

    case 'startAuction': {
      if (state.currentAuction && !state.currentAuction.lockedIn) return state;
      if (!state.valueDeck.includes(action.valueId)) return state;
      const auction = {
        valueId: action.valueId,
        startedAt: action.at,
        durationMs: action.durationMs,
        lockedIn: false,
      };
      const next = { ...state, currentAuction: auction };
      return pushEvent(next, 'auctionStarted', action.at, { valueId: action.valueId });
    }

    case 'placeBid': {
      const a = state.currentAuction;
      if (!a || a.lockedIn) return state;
      const team = state.teams.find((t) => t.id === action.teamId);
      if (!team) return state;
      const minAmount = a.highBid ? a.highBid.amount + MIN_BID_INCREMENT : MIN_BID_INCREMENT;
      if (action.amount < minAmount) return state;
      if (action.amount > team.credos) return state;
      const highBid = { teamId: action.teamId, amount: action.amount, at: action.at };
      const next = {
        ...state,
        currentAuction: { ...a, highBid },
      };
      return pushEvent(next, 'bidPlaced', action.at, {
        teamId: action.teamId,
        amount: action.amount,
        valueId: a.valueId,
      });
    }

    case 'lockIn': {
      const a = state.currentAuction;
      if (!a || a.lockedIn) return state;
      let teams = state.teams;
      let completed = a;
      if (a.highBid) {
        const winnerId = a.highBid.teamId;
        const amount = a.highBid.amount;
        teams = state.teams.map((t) =>
          t.id === winnerId
            ? {
                ...t,
                credos: Math.max(0, t.credos - amount),
                wonValues: [...t.wonValues, a.valueId],
              }
            : t,
        );
        completed = { ...a, lockedIn: true, winnerTeamId: winnerId };
      } else {
        completed = { ...a, lockedIn: true };
      }
      const valueDeck = state.valueDeck.filter((v) => v !== a.valueId);
      const next = {
        ...state,
        teams,
        valueDeck,
        currentAuction: undefined,
        completedAuctions: [...state.completedAuctions, completed],
      };
      return pushEvent(next, 'valueLocked', action.at, {
        valueId: a.valueId,
        winnerTeamId: completed.winnerTeamId ?? null,
        amount: a.highBid?.amount ?? 0,
      });
    }

    case 'writePurpose': {
      const teams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, purposeStatement: action.statement } : t,
      );
      const next = { ...state, teams };
      return pushEvent(next, 'purposeWritten', action.at, {
        teamId: action.teamId,
      });
    }

    case 'broadcast': {
      const next = { ...state, broadcast: { message: action.message, at: action.at } };
      return pushEvent(next, 'facilitatorBroadcast', action.at, { message: action.message });
    }

    case 'override': {
      const next = { ...state, ...action.patch };
      return pushEvent(next, 'facilitatorOverride', action.at, { reason: action.reason });
    }

    default: {
      const _never: never = action;
      void _never;
      return state;
    }
  }
}

export function stepActAdvance(state: Session, at: number): Session {
  const next = nextAct(state.currentAct);
  if (!next) return state;
  return reduce(state, { type: 'advanceAct', to: next, at });
}

export const CONSTANTS = { START_CREDOS, MIN_BID_INCREMENT, ACTS };
