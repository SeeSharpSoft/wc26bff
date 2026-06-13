import { describe, expect, it } from '@jest/globals';
import {
  flagUrl,
  getGroup,
  getMatch,
  getMatchesByGroup,
  getMatchesByStage,
  getTeam,
  groups,
  matches,
  resolveTeamRef,
  teamRefLabel,
  teams,
} from '../../src/data';
import type { Match, Stage } from '../../src/types';

describe('teams', () => {
  it('has exactly 48 teams', () => {
    expect(teams).toHaveLength(48);
  });

  it('has unique ids', () => {
    expect(new Set(teams.map((t) => t.id)).size).toBe(48);
  });

  it('assigns every team to a valid group A-L', () => {
    for (const team of teams) {
      expect(team.groupId).toMatch(/^[A-L]$/);
    }
  });

  it('gives every team a non-empty name, flag and country code', () => {
    for (const team of teams) {
      expect(team.name.length).toBeGreaterThan(0);
      expect(team.flag.length).toBeGreaterThan(0);
      expect(team.countryCode.length).toBeGreaterThan(0);
    }
  });
});

describe('groups', () => {
  it('has 12 groups A-L', () => {
    expect(groups.map((g) => g.id)).toEqual([
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    ]);
  });

  it('each group has exactly 4 teams', () => {
    for (const group of groups) {
      expect(group.teamIds).toHaveLength(4);
    }
  });

  it('group team ids reference existing teams', () => {
    for (const group of groups) {
      for (const id of group.teamIds) {
        expect(getTeam(id)).toBeDefined();
      }
    }
  });

  it('every team appears in exactly one group', () => {
    const all = groups.flatMap((g) => g.teamIds);
    expect(all).toHaveLength(48);
    expect(new Set(all).size).toBe(48);
  });
});

describe('matches', () => {
  it('has 104 matches numbered 1..104 uniquely', () => {
    expect(matches).toHaveLength(104);
    const numbers = matches.map((m) => m.number).sort((a, b) => a - b);
    expect(numbers[0]).toBe(1);
    expect(numbers[103]).toBe(104);
    expect(new Set(numbers).size).toBe(104);
  });

  it('has 72 group matches and 32 knockout matches', () => {
    const group = matches.filter((m) => m.stage === 'group');
    const knockout = matches.filter((m) => m.stage !== 'group');
    expect(group).toHaveLength(72);
    expect(knockout).toHaveLength(32);
  });

  it('each group plays 6 matches', () => {
    for (const group of groups) {
      expect(getMatchesByGroup(group.id)).toHaveLength(6);
    }
  });

  it('has the expected number of matches per knockout stage', () => {
    const counts: Record<Stage, number> = {
      group: 72,
      round32: 16,
      round16: 8,
      quarter: 4,
      semi: 2,
      third: 1,
      final: 1,
    };
    for (const stage of Object.keys(counts) as Stage[]) {
      expect(getMatchesByStage(stage)).toHaveLength(counts[stage]);
    }
  });

  it('group matches reference concrete teams, knockout matches use placeholders', () => {
    for (const m of matches) {
      if (m.stage === 'group') {
        expect(m.home.kind).toBe('team');
        expect(m.away.kind).toBe('team');
      } else {
        expect(m.home.kind).toBe('placeholder');
        expect(m.away.kind).toBe('placeholder');
      }
    }
  });

  it('every match has a valid ISO-8601 UTC kickoff within the tournament window', () => {
    const start = Date.parse('2026-06-11T00:00:00Z');
    const end = Date.parse('2026-07-20T00:00:00Z');
    for (const m of matches) {
      const t = Date.parse(m.kickoff);
      expect(Number.isNaN(t)).toBe(false);
      expect(m.kickoff.endsWith('Z')).toBe(true);
      expect(t).toBeGreaterThanOrEqual(start);
      expect(t).toBeLessThanOrEqual(end);
    }
  });

  it('matches are ordered chronologically within the group stage', () => {
    const group = matches.filter((m) => m.stage === 'group');
    for (let i = 1; i < group.length; i++) {
      expect(group[i].number).toBeGreaterThan(group[i - 1].number);
    }
  });

  it('group matches only involve teams from their own group', () => {
    for (const m of matches.filter((mt) => mt.stage === 'group')) {
      const grp = getGroup(m.groupId as string);
      expect(grp).toBeDefined();
      const ids = new Set(grp!.teamIds);
      const home = m.home as Extract<Match['home'], { kind: 'team' }>;
      const away = m.away as Extract<Match['away'], { kind: 'team' }>;
      expect(ids.has(home.teamId)).toBe(true);
      expect(ids.has(away.teamId)).toBe(true);
      expect(home.teamId).not.toBe(away.teamId);
    }
  });

  it('seeds the known finished results from the source data', () => {
    const opener = getMatch('m001');
    expect(opener?.home).toEqual({ kind: 'team', teamId: 'mexico' });
    expect(opener?.away).toEqual({ kind: 'team', teamId: 'south-africa' });
    expect(opener?.officialResult).toEqual({ homeGoals: 2, awayGoals: 0 });
  });
});

describe('helpers', () => {
  it('resolveTeamRef resolves teams and ignores placeholders', () => {
    expect(resolveTeamRef({ kind: 'team', teamId: 'brazil' })?.name).toBe('Brazil');
    expect(resolveTeamRef({ kind: 'placeholder', label: 'W74' })).toBeUndefined();
  });

  it('teamRefLabel returns a name or the placeholder label', () => {
    expect(teamRefLabel({ kind: 'team', teamId: 'spain' })).toBe('Spain');
    expect(teamRefLabel({ kind: 'placeholder', label: '2A' })).toBe('2A');
  });

  it('flagUrl builds a flagcdn url from the country code', () => {
    const england = getTeam('england')!;
    expect(flagUrl(england)).toBe('https://flagcdn.com/gb-eng.svg');
  });
});
