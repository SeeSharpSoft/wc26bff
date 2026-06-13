// Pure bet logic. Bets are stored as a nested map keyed by user then match:
//   Record<userId, Record<matchId, Bet>>
// All functions are immutable and side-effect free.

import type { Bet } from '../types';

export type BetsByUser = Record<string, Record<string, Bet>>;

function isNonNegativeInt(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

export function getBet(
  all: BetsByUser,
  userId: string,
  matchId: string,
): Bet | undefined {
  return all[userId]?.[matchId];
}

export function getUserBets(all: BetsByUser, userId: string): Record<string, Bet> {
  return all[userId] ?? {};
}

/** Upsert a bet for (user, match). Throws on invalid (non-integer / negative) goals. */
export function setBet(
  all: BetsByUser,
  userId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  now: () => string = () => new Date().toISOString(),
): BetsByUser {
  if (!isNonNegativeInt(homeGoals) || !isNonNegativeInt(awayGoals)) {
    throw new Error('Goals must be non-negative integers');
  }
  const bet: Bet = { userId, matchId, homeGoals, awayGoals, updatedAt: now() };
  return {
    ...all,
    [userId]: { ...(all[userId] ?? {}), [matchId]: bet },
  };
}

/** Remove a bet for (user, match) if present. */
export function clearBet(
  all: BetsByUser,
  userId: string,
  matchId: string,
): BetsByUser {
  const userBets = all[userId];
  if (!userBets || !(matchId in userBets)) return all;
  const nextUserBets = { ...userBets };
  delete nextUserBets[matchId];
  return { ...all, [userId]: nextUserBets };
}

/** Drop all bets belonging to a removed user. */
export function clearUserBets(all: BetsByUser, userId: string): BetsByUser {
  if (!(userId in all)) return all;
  const next = { ...all };
  delete next[userId];
  return next;
}
