import { describe, expect, it } from '@jest/globals';
import { computeBracket } from '../../src/domain/bracket';
import type { Match, Result, TeamRef } from '../../src/types';

function group(id: string, num: number, home: string, away: string): Match {
  return {
    id,
    number: num,
    stage: 'group',
    groupId: 'A',
    roundLabel: 'Group A',
    kickoff: '2026-06-11T19:00:00.000Z',
    venue: 'X',
    home: { kind: 'team', teamId: home },
    away: { kind: 'team', teamId: away },
    officialResult: null,
  };
}

function placeholder(label: string): TeamRef {
  return { kind: 'placeholder', label };
}

function ko(id: string, num: number, home: string, away: string): Match {
  return {
    id,
    number: num,
    stage: 'round32',
    groupId: null,
    roundLabel: 'Round of 32',
    kickoff: '2026-07-01T19:00:00.000Z',
    venue: 'X',
    home: placeholder(home),
    away: placeholder(away),
    officialResult: null,
  };
}

function finished(matchId: string, h: number, a: number): Result {
  return { matchId, homeGoals: h, awayGoals: a, status: 'finished' };
}

// Group A with 3 teams a/b/c playing a tiny round-robin (3 matches).
const GROUP_MATCHES = [
  group('m1', 1, 'a', 'b'),
  group('m2', 2, 'a', 'c'),
  group('m3', 3, 'b', 'c'),
];
// KO match #50 uses 1A v 2A; #60 uses W50 v 2A.
const KO_MATCHES = [ko('m50', 50, '1A', '2A'), ko('m60', 60, 'W50', '2A')];
const MATCHES = [...GROUP_MATCHES, ...KO_MATCHES];

describe('computeBracket', () => {
  it('leaves placeholders unresolved while the group is incomplete', () => {
    const refs = computeBracket(MATCHES, { m1: finished('m1', 1, 0) });
    expect(refs.m50.home).toEqual({ kind: 'placeholder', label: '1A' });
  });

  it('resolves group winner/runner-up once the group is complete', () => {
    const results = {
      m1: finished('m1', 1, 0), // a beats b
      m2: finished('m2', 2, 0), // a beats c
      m3: finished('m3', 0, 0), // b draws c
    };
    // a: 6 pts (1st). b: 1 pt, GD -1. c: 1 pt, GD -2. -> b is runner-up.
    const refs = computeBracket(MATCHES, results);
    expect(refs.m50.home).toEqual({ kind: 'team', teamId: 'a' });
    expect(refs.m50.away).toEqual({ kind: 'team', teamId: 'b' });
  });

  it('resolves W## winners and propagates to later matches', () => {
    const results = {
      m1: finished('m1', 1, 0),
      m2: finished('m2', 2, 0),
      m3: finished('m3', 0, 0),
      m50: finished('m50', 3, 1), // 1A (a) beats 2A (b) -> winner a
    };
    const refs = computeBracket(MATCHES, results);
    expect(refs.m60.home).toEqual({ kind: 'team', teamId: 'a' });
    // away of m60 is 2A -> b
    expect(refs.m60.away).toEqual({ kind: 'team', teamId: 'b' });
  });

  it('does not resolve a winner from a drawn (penalty) knockout score', () => {
    const results = {
      m1: finished('m1', 1, 0),
      m2: finished('m2', 2, 0),
      m3: finished('m3', 0, 0),
      m50: finished('m50', 1, 1), // draw -> winner unknown from goals
    };
    const refs = computeBracket(MATCHES, results);
    expect(refs.m60.home).toEqual({ kind: 'placeholder', label: 'W50' });
  });
});
