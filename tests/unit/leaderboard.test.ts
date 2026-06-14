import { describe, expect, it } from '@jest/globals';
import { computeLeaderboard } from '../../src/domain/leaderboard';
import type { BetsByUser } from '../../src/domain/bets';
import type { Result, User } from '../../src/types';

function user(id: string, name: string): User {
  return { id, name, createdAt: '2026-01-01T00:00:00.000Z' };
}

function finished(matchId: string, h: number, a: number): Result {
  return { matchId, homeGoals: h, awayGoals: a, status: 'finished' };
}

const USERS = [user('u1', 'Alice'), user('u2', 'Bob')];

const BETS: BetsByUser = {
  u1: {
    m001: { userId: 'u1', matchId: 'm001', homeGoals: 2, awayGoals: 0, updatedAt: 'x' }, // exact -> 3
    m002: { userId: 'u1', matchId: 'm002', homeGoals: 1, awayGoals: 0, updatedAt: 'x' }, // tendency -> 1
  },
  u2: {
    m001: { userId: 'u2', matchId: 'm001', homeGoals: 0, awayGoals: 1, updatedAt: 'x' }, // wrong -> 0
  },
};

const RESULTS: Record<string, Result> = {
  m001: finished('m001', 2, 0),
  m002: finished('m002', 3, 1),
};

describe('computeleaderboard', () => {
  it('totals points and counts exact/diff/tendency hits', () => {
    const rows = computeLeaderboard(USERS, BETS, RESULTS);
    const alice = rows.find((r) => r.userId === 'u1')!;
    expect(alice).toMatchObject({ points: 4, exact: 1, diff: 0, tendency: 1, played: 2 });
    const bob = rows.find((r) => r.userId === 'u2')!;
    expect(bob).toMatchObject({ points: 0, exact: 0, diff: 0, tendency: 0, played: 1 });
  });

  it('counts a correct goal difference as a 2-point diff hit', () => {
    const users = [user('u1', 'Alice')];
    const bets: BetsByUser = {
      u1: {
        // actual 0:1, guess 1:2 — same margin → 2 points.
        m001: { userId: 'u1', matchId: 'm001', homeGoals: 1, awayGoals: 2, updatedAt: 'x' },
      },
    };
    const results: Record<string, Result> = { m001: finished('m001', 0, 1) };
    const [alice] = computeLeaderboard(users, bets, results);
    expect(alice).toMatchObject({ points: 2, exact: 0, diff: 1, tendency: 0, played: 1 });
  });

  it('ranks by points then exact hits then name', () => {
    const rows = computeLeaderboard(USERS, BETS, RESULTS);
    expect(rows.map((r) => r.userId)).toEqual(['u1', 'u2']);
  });

  it('ignores non-finished results', () => {
    const results: Record<string, Result> = {
      m001: { matchId: 'm001', homeGoals: 2, awayGoals: 0, status: 'live' },
    };
    const rows = computeLeaderboard(USERS, BETS, results);
    expect(rows.every((r) => r.points === 0 && r.played === 0)).toBe(true);
  });

  it('returns a row per user even with no bets', () => {
    const rows = computeLeaderboard(USERS, {}, RESULTS);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.points === 0)).toBe(true);
  });

  it('breaks a points tie by exact hits', () => {
    const users = [user('a', 'Ann'), user('b', 'Ben')];
    const bets: BetsByUser = {
      a: { m001: { userId: 'a', matchId: 'm001', homeGoals: 2, awayGoals: 0, updatedAt: 'x' } }, // exact 3
      b: {
        m001: { userId: 'b', matchId: 'm001', homeGoals: 5, awayGoals: 1, updatedAt: 'x' }, // tendency 1
        m002: { userId: 'b', matchId: 'm002', homeGoals: 9, awayGoals: 8, updatedAt: 'x' }, // tendency 1
        m003: { userId: 'b', matchId: 'm003', homeGoals: 4, awayGoals: 2, updatedAt: 'x' }, // tendency 1
      },
    };
    const results: Record<string, Result> = {
      m001: finished('m001', 2, 0),
      m002: finished('m002', 3, 1),
      m003: finished('m003', 1, 0),
    };
    const rows = computeLeaderboard(users, bets, results);
    // Both have 3 points; Ann wins on exact hits.
    expect(rows[0].userId).toBe('a');
  });
});
