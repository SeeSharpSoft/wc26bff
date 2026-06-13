// Bet locking / reveal rules. Pure and time-injectable for testing.
//
// Bets are stored in UTC instants and compared against "now" (ms since epoch).
// A bet may be placed/edited only before kickoff. Once a match has started it is
// locked, and (in viewer mode) the bet becomes revealed. See DEVELOPMENT.md §3.

import type { Match } from '../types';

export function kickoffMs(match: Match): number {
  return Date.parse(match.kickoff);
}

/** True once the match kickoff time has passed. */
export function isMatchStarted(match: Match, nowMs: number = Date.now()): boolean {
  return nowMs >= kickoffMs(match);
}

/** True while the match has not started — bets can still be placed/edited. */
export function canPlaceBet(match: Match, nowMs: number = Date.now()): boolean {
  return !isMatchStarted(match, nowMs);
}

/** A bet is locked exactly when the match has started. */
export function isBetLocked(match: Match, nowMs: number = Date.now()): boolean {
  return isMatchStarted(match, nowMs);
}

/** In viewer mode a user's bet is revealed only after the match has started. */
export function isBetRevealed(match: Match, nowMs: number = Date.now()): boolean {
  return isMatchStarted(match, nowMs);
}
