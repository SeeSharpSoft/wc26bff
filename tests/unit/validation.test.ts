import { describe, expect, it } from '@jest/globals';
import {
  sanitizeBets,
  sanitizeResults,
  sanitizeUsers,
  isValidUser,
  isValidBet,
  isValidResult,
} from '../../src/storage/validation';

describe('sanitizeUsers', () => {
  it('keeps only well-formed users and drops duplicates by id', () => {
    const input = [
      { id: 'a', name: 'Ann', createdAt: 'x' },
      { id: 'a', name: 'Dup', createdAt: 'y' }, // duplicate id
      { id: '', name: 'Empty', createdAt: 'z' }, // empty id
      { id: 'b', name: 123, createdAt: 'z' }, // bad name type
      null,
      'nope',
      { id: 'c', name: 'Cara', createdAt: 'z' },
    ];
    expect(sanitizeUsers(input)).toEqual([
      { id: 'a', name: 'Ann', createdAt: 'x' },
      { id: 'c', name: 'Cara', createdAt: 'z' },
    ]);
  });

  it('returns [] for non-array input', () => {
    expect(sanitizeUsers({ id: 'a' })).toEqual([]);
    expect(sanitizeUsers(null)).toEqual([]);
  });
});

describe('sanitizeBets', () => {
  it('keeps only valid bets and prunes empty user buckets', () => {
    const valid = { userId: 'u', matchId: 'm1', homeGoals: 2, awayGoals: 1, updatedAt: 't' };
    const input = {
      u: {
        m1: valid,
        m2: { userId: 'u', matchId: 'm2', homeGoals: 'x', awayGoals: 1, updatedAt: 't' },
      },
      empty: { m3: { nonsense: true } },
      bad: 'not-an-object',
    };
    expect(sanitizeBets(input)).toEqual({ u: { m1: valid } });
  });

  it('returns {} for non-object input', () => {
    expect(sanitizeBets([])).toEqual({});
    expect(sanitizeBets(null)).toEqual({});
  });
});

describe('sanitizeResults', () => {
  it('keeps only valid results with a known status', () => {
    const ok = { matchId: 'm1', homeGoals: 1, awayGoals: 0, status: 'finished' };
    const input = {
      m1: ok,
      m2: { matchId: 'm2', homeGoals: 1, awayGoals: 0, status: 'bogus' },
      m3: { matchId: 'm3', homeGoals: NaN, awayGoals: 0, status: 'finished' },
    };
    expect(sanitizeResults(input)).toEqual({ m1: ok });
  });
});

describe('type guards', () => {
  it('validate individual records', () => {
    expect(isValidUser({ id: 'a', name: 'A', createdAt: 'x' })).toBe(true);
    expect(isValidUser({ id: 'a' })).toBe(false);
    expect(isValidBet({ userId: 'u', matchId: 'm', homeGoals: 0, awayGoals: 0, updatedAt: 't' })).toBe(
      true,
    );
    expect(isValidBet({ userId: 'u', matchId: 'm', homeGoals: 0, awayGoals: 0 })).toBe(false);
    expect(isValidResult({ matchId: 'm', homeGoals: 0, awayGoals: 0, status: 'live' })).toBe(true);
    expect(isValidResult({ matchId: 'm', homeGoals: 0, awayGoals: 0, status: 'x' })).toBe(false);
  });
});
