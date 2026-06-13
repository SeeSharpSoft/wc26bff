import { describe, expect, it } from '@jest/globals';
import { computeGroupStandings } from '../../src/domain/standings';
import type { Match, Result } from '../../src/types';

function groupMatch(id: string, homeId: string, awayId: string): Match {
  return {
    id,
    number: 1,
    stage: 'group',
    groupId: 'A',
    roundLabel: 'Group A',
    kickoff: '2026-06-11T19:00:00.000Z',
    venue: 'X',
    home: { kind: 'team', teamId: homeId },
    away: { kind: 'team', teamId: awayId },
    officialResult: null,
  };
}

function finished(matchId: string, h: number, a: number): Result {
  return { matchId, homeGoals: h, awayGoals: a, status: 'finished' };
}

const TEAMS = ['a', 'b', 'c', 'd'];
const MATCHES = [
  groupMatch('m1', 'a', 'b'),
  groupMatch('m2', 'c', 'd'),
  groupMatch('m3', 'a', 'c'),
];

describe('computeGroupStandings', () => {
  it('returns all teams with zeroes when there are no results', () => {
    const rows = computeGroupStandings(TEAMS, MATCHES, {});
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it('accumulates wins, draws and goals', () => {
    const results: Record<string, Result> = {
      m1: finished('m1', 2, 0), // a beats b
      m2: finished('m2', 1, 1), // c draws d
      m3: finished('m3', 0, 1), // c beats a
    };
    const rows = computeGroupStandings(TEAMS, MATCHES, results);
    const byId = Object.fromEntries(rows.map((r) => [r.teamId, r]));

    expect(byId.a).toMatchObject({ played: 2, won: 1, lost: 1, points: 3, goalsFor: 2, goalsAgainst: 1 });
    expect(byId.c).toMatchObject({ played: 2, won: 1, drawn: 1, points: 4, goalDiff: 1 });
    expect(byId.b).toMatchObject({ played: 1, lost: 1, points: 0 });
    expect(byId.d).toMatchObject({ played: 1, drawn: 1, points: 1 });
  });

  it('sorts by points, then goal difference, then goals for', () => {
    const results: Record<string, Result> = {
      m1: finished('m1', 2, 0),
      m2: finished('m2', 1, 1),
      m3: finished('m3', 0, 1),
    };
    const rows = computeGroupStandings(TEAMS, MATCHES, results);
    expect(rows[0].teamId).toBe('c'); // 4 pts
    expect(rows[1].teamId).toBe('a'); // 3 pts
  });

  it('ignores non-finished results', () => {
    const results: Record<string, Result> = {
      m1: { matchId: 'm1', homeGoals: 2, awayGoals: 0, status: 'live' },
    };
    const rows = computeGroupStandings(TEAMS, MATCHES, results);
    expect(rows.every((r) => r.played === 0)).toBe(true);
  });
});
