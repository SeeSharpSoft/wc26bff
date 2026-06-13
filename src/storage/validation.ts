// Runtime validation / sanitisation for persisted data.
//
// localStorage is user-writable and survives across app versions, so anything
// read back may be missing, malformed, or tampered with. These guards keep only
// well-formed records and silently drop the rest, so a single corrupt entry can
// never crash the app. See DEVELOPMENT.md §4.

import type { Bet, MatchStatus, Result, User } from '../types';
import type { BetsByUser } from '../domain/bets';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

const STATUSES: ReadonlySet<string> = new Set(['scheduled', 'live', 'finished']);

export function isValidUser(v: unknown): v is User {
  return (
    isObject(v) &&
    isNonEmptyString(v.id) &&
    typeof v.name === 'string' &&
    typeof v.createdAt === 'string'
  );
}

/** Keep only well-formed users (dropping duplicates by id). */
export function sanitizeUsers(v: unknown): User[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: User[] = [];
  for (const item of v) {
    if (!isValidUser(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push({ id: item.id, name: item.name, createdAt: item.createdAt });
  }
  return out;
}

export function isValidBet(v: unknown): v is Bet {
  return (
    isObject(v) &&
    isNonEmptyString(v.userId) &&
    isNonEmptyString(v.matchId) &&
    isFiniteNumber(v.homeGoals) &&
    isFiniteNumber(v.awayGoals) &&
    typeof v.updatedAt === 'string'
  );
}

/** Keep only well-formed bets, preserving the userId → matchId → Bet shape. */
export function sanitizeBets(v: unknown): BetsByUser {
  if (!isObject(v)) return {};
  const out: BetsByUser = {};
  for (const [userId, byMatch] of Object.entries(v)) {
    if (!isObject(byMatch)) continue;
    const cleaned: Record<string, Bet> = {};
    for (const [matchId, bet] of Object.entries(byMatch)) {
      if (isValidBet(bet)) cleaned[matchId] = bet;
    }
    if (Object.keys(cleaned).length > 0) out[userId] = cleaned;
  }
  return out;
}

export function isValidResult(v: unknown): v is Result {
  return (
    isObject(v) &&
    isNonEmptyString(v.matchId) &&
    isFiniteNumber(v.homeGoals) &&
    isFiniteNumber(v.awayGoals) &&
    typeof v.status === 'string' &&
    STATUSES.has(v.status as MatchStatus)
  );
}

/** Keep only well-formed results, keyed by matchId. */
export function sanitizeResults(v: unknown): Record<string, Result> {
  if (!isObject(v)) return {};
  const out: Record<string, Result> = {};
  for (const [matchId, result] of Object.entries(v)) {
    if (isValidResult(result)) out[matchId] = result;
  }
  return out;
}
