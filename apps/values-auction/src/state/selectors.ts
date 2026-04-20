import type { Session, Team, Participant } from './types.js';
import { getAct } from '../content/acts.js';

export function teamOfParticipant(s: Session, participantId: string): Team | undefined {
  const p = s.participants.find((pp) => pp.id === participantId);
  if (!p || !p.teamId) return undefined;
  return s.teams.find((t) => t.id === p.teamId);
}

export function teammates(s: Session, teamId: string): Participant[] {
  return s.participants.filter((p) => p.teamId === teamId);
}

export function remainingMs(s: Session, now: number): number {
  if (!s.actStartedAt) return s.actDurationMs;
  if (s.paused) return Math.max(0, s.actDurationMs - 0);
  const elapsed = now - s.actStartedAt;
  return Math.max(0, s.actDurationMs - elapsed);
}

export function auctionRemainingMs(s: Session, now: number): number {
  if (!s.currentAuction) return 0;
  const elapsed = now - s.currentAuction.startedAt;
  return Math.max(0, s.currentAuction.durationMs - elapsed);
}

export function bidVelocity(s: Session, windowMs: number, now: number): number {
  const cutoff = now - windowMs;
  const bids = s.events.filter((e) => e.type === 'bidPlaced' && e.at >= cutoff);
  return bids.length / (windowMs / 60_000);
}

export function silentTeams(s: Session, silentMs: number, now: number): Team[] {
  const cutoff = now - silentMs;
  return s.teams.filter((t) => {
    const lastBid = [...s.events].reverse().find((e) => e.type === 'bidPlaced' && (e.payload as any).teamId === t.id);
    if (!lastBid) return true;
    return lastBid.at < cutoff;
  });
}

export function leaderboard(s: Session): Array<Team & { valueCount: number }> {
  return [...s.teams]
    .map((t) => ({ ...t, valueCount: t.wonValues.length }))
    .sort((a, b) => b.credos - a.credos);
}

export function actLabel(s: Session): string {
  return getAct(s.currentAct).name;
}

export function canStartAuction(s: Session): boolean {
  return s.currentAct === 'auction' && (!s.currentAuction || s.currentAuction.lockedIn);
}

export function patternByValue(s: Session): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const t of s.teams) {
    for (const v of t.wonValues) {
      if (!out[v]) out[v] = [];
      out[v].push(t.id);
    }
  }
  return out;
}
