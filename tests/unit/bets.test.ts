import { describe, expect, it } from '@jest/globals';
import {
  clearBet,
  clearUserBets,
  getBet,
  getUserBets,
  setBet,
  type BetsByUser,
} from '../../src/domain/bets';

const FIXED = '2026-06-01T00:00:00.000Z';
const now = () => FIXED;

describe('setBet', () => {
  it('inserts a bet for a new user/match', () => {
    const next = setBet({}, 'u1', 'm001', 2, 1, now);
    expect(getBet(next, 'u1', 'm001')).toEqual({
      userId: 'u1',
      matchId: 'm001',
      homeGoals: 2,
      awayGoals: 1,
      updatedAt: FIXED,
    });
  });

  it('does not mutate the input', () => {
    const all: BetsByUser = {};
    const next = setBet(all, 'u1', 'm001', 0, 0, now);
    expect(all).toEqual({});
    expect(next).not.toBe(all);
  });

  it('overwrites an existing bet without touching other users', () => {
    let all = setBet({}, 'u1', 'm001', 1, 1, now);
    all = setBet(all, 'u2', 'm001', 3, 0, now);
    all = setBet(all, 'u1', 'm001', 2, 2, now);
    expect(getBet(all, 'u1', 'm001')).toMatchObject({ homeGoals: 2, awayGoals: 2 });
    expect(getBet(all, 'u2', 'm001')).toMatchObject({ homeGoals: 3, awayGoals: 0 });
  });

  it.each([
    [-1, 0],
    [0, -1],
    [1.5, 0],
    [0, Number.NaN],
  ])('rejects invalid goals (%p:%p)', (h, a) => {
    expect(() => setBet({}, 'u1', 'm001', h, a, now)).toThrow();
  });
});

describe('getBet / getUserBets', () => {
  it('returns undefined for missing bet', () => {
    expect(getBet({}, 'u1', 'm001')).toBeUndefined();
  });

  it('returns an empty object for a user with no bets', () => {
    expect(getUserBets({}, 'u1')).toEqual({});
  });
});

describe('clearBet', () => {
  it('removes only the targeted bet', () => {
    let all = setBet({}, 'u1', 'm001', 1, 0, now);
    all = setBet(all, 'u1', 'm002', 2, 2, now);
    const next = clearBet(all, 'u1', 'm001');
    expect(getBet(next, 'u1', 'm001')).toBeUndefined();
    expect(getBet(next, 'u1', 'm002')).toBeDefined();
  });

  it('is a no-op when the bet does not exist', () => {
    const all = setBet({}, 'u1', 'm001', 1, 0, now);
    expect(clearBet(all, 'u1', 'm999')).toBe(all);
  });
});

describe('clearUserBets', () => {
  it('drops all bets for a user', () => {
    let all = setBet({}, 'u1', 'm001', 1, 0, now);
    all = setBet(all, 'u2', 'm001', 0, 1, now);
    const next = clearUserBets(all, 'u1');
    expect(getUserBets(next, 'u1')).toEqual({});
    expect(getBet(next, 'u2', 'm001')).toBeDefined();
  });

  it('is a no-op for an unknown user', () => {
    const all = setBet({}, 'u1', 'm001', 1, 0, now);
    expect(clearUserBets(all, 'ghost')).toBe(all);
  });
});
