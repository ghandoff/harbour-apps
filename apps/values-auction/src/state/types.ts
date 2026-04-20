import type { ActId } from '../content/acts.js';

export type { ActId };

export type TeamColour = 'cadet' | 'redwood' | 'sienna' | 'champagne' | 'deep' | 'sand';
export type Archetype = 'builder' | 'diplomat' | 'rebel' | 'steward';
export type Zone = 'must' | 'nice' | 'wont';

export interface Session {
  id: string;
  createdAt: number;
  startedAt?: number;
  currentAct: ActId;
  actStartedAt?: number;
  actDurationMs: number;
  facilitatorId: string;
  teams: Team[];
  participants: Participant[];
  valueDeck: string[];
  currentAuction?: Auction;
  completedAuctions: Auction[];
  events: SessionEvent[];
  broadcast?: { message: string; at: number };
  paused?: boolean;
}

export interface Team {
  id: string;
  name: string;
  colour: TeamColour;
  startupId: string;
  credos: number;
  intentions: Record<string, Zone | null>;
  softCeilings: Record<string, number>;
  wonValues: string[];
  purposeStatement?: string;
}

export interface Participant {
  id: string;
  displayName: string;
  teamId: string | null;
  joinedAt: number;
  lastSeenAt: number;
  archetype?: Archetype;
}

export interface Auction {
  valueId: string;
  startedAt: number;
  durationMs: number;
  highBid?: { teamId: string; amount: number; at: number };
  lockedIn: boolean;
  winnerTeamId?: string;
}

export type SessionEventType =
  | 'sessionCreated'
  | 'teamJoined'
  | 'participantJoined'
  | 'archetypeChosen'
  | 'teamAssigned'
  | 'actAdvanced'
  | 'intentionSet'
  | 'softCeilingSet'
  | 'auctionStarted'
  | 'bidPlaced'
  | 'valueLocked'
  | 'purposeWritten'
  | 'facilitatorPaused'
  | 'facilitatorExtended'
  | 'facilitatorBroadcast'
  | 'facilitatorOverride';

export interface SessionEvent {
  id: string;
  at: number;
  type: SessionEventType;
  payload: Record<string, unknown>;
}

export type Action =
  | { type: 'createSession'; sessionId: string; facilitatorId: string; at: number }
  | { type: 'joinParticipant'; participantId: string; displayName: string; at: number }
  | { type: 'chooseArchetype'; participantId: string; archetype: Archetype; at: number }
  | { type: 'assignTeams'; assignments: Array<{ teamId: string; name: string; colour: TeamColour; startupId: string; participantIds: string[] }>; at: number }
  | { type: 'advanceAct'; to: ActId; at: number }
  | { type: 'extendAct'; addMs: number; at: number }
  | { type: 'pauseSession'; paused: boolean; at: number }
  | { type: 'setIntention'; teamId: string; valueId: string; zone: Zone | null; at: number }
  | { type: 'setSoftCeiling'; teamId: string; valueId: string; amount: number; at: number }
  | { type: 'startAuction'; valueId: string; durationMs: number; at: number }
  | { type: 'placeBid'; teamId: string; amount: number; at: number }
  | { type: 'lockIn'; at: number }
  | { type: 'writePurpose'; teamId: string; statement: string; at: number }
  | { type: 'broadcast'; message: string; at: number }
  | { type: 'override'; reason: string; patch: Partial<Session>; at: number };
