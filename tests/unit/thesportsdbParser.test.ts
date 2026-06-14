import { describe, expect, it } from '@jest/globals';
import { parseTheSportsDbEvents } from '../../src/services/thesportsdbParser';

describe('parseTheSportsDbEvents', () => {
  const payload = {
    events: [
      {
        strHomeTeam: 'Mexico',
        strAwayTeam: 'South Africa',
        intHomeScore: '2',
        intAwayScore: '0',
        strStatus: 'FT',
      },
      {
        strHomeTeam: 'Brazil',
        strAwayTeam: 'Morocco',
        intHomeScore: '1',
        intAwayScore: '1',
        strStatus: '2H',
      },
      {
        strHomeTeam: 'Spain',
        strAwayTeam: 'Cape Verde',
        intHomeScore: null,
        intAwayScore: null,
        strStatus: 'NS',
      },
    ],
  };

  it('marks finished matches as finished', () => {
    const out = parseTheSportsDbEvents(payload);
    expect(out).toContainEqual({
      homeName: 'Mexico',
      awayName: 'South Africa',
      homeGoals: 2,
      awayGoals: 0,
      status: 'finished',
    });
  });

  it('marks in-play matches as live with the current score', () => {
    const out = parseTheSportsDbEvents(payload);
    expect(out).toContainEqual({
      homeName: 'Brazil',
      awayName: 'Morocco',
      homeGoals: 1,
      awayGoals: 1,
      status: 'live',
    });
  });

  it('skips not-started and scoreless events', () => {
    const out = parseTheSportsDbEvents(payload);
    expect(out).toHaveLength(2);
    expect(out.some((r) => r.homeName === 'Spain')).toBe(false);
  });

  it('tolerates a missing or malformed payload', () => {
    expect(parseTheSportsDbEvents(null)).toEqual([]);
    expect(parseTheSportsDbEvents({})).toEqual([]);
    expect(parseTheSportsDbEvents({ events: 'nope' })).toEqual([]);
  });
});
