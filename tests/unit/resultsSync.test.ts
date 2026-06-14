import { describe, expect, it } from '@jest/globals';
import { syncResults } from '../../src/services/resultsSync';

const SAMPLE = `
Thu June 11
  13:00 UTC-6     Mexico  2-0 (1-0)  South Africa        @ Mexico City
  20:00 UTC-6     South Korea  2-1 (0-0)  Czech Republic     @ Guadalajara
  19:00 UTC-6     Atlantis  1-1 (0-0)  Mythica     @ Nowhere
`;

function fakeFetch(text: string, ok = true, status = 200): typeof fetch {
  return (async () =>
    ({
      ok,
      status,
      text: async () => text,
    }) as Response) as unknown as typeof fetch;
}

function fakeJsonFetch(text: string, ok = true, status = 200): typeof fetch {
  return (async () =>
    ({
      ok,
      status,
      json: async () => JSON.parse(text),
    }) as Response) as unknown as typeof fetch;
}

describe('syncResults', () => {
  it('maps parsed scorelines onto known match ids', async () => {
    const results = await syncResults({
      sources: ['http://example.test/cup.txt'],
      fetchImpl: fakeFetch(SAMPLE),
    });
    // Mexico 2-0 South Africa is the opener (m001).
    expect(results.m001).toEqual({
      matchId: 'm001',
      homeGoals: 2,
      awayGoals: 0,
      status: 'finished',
    });
    // South Korea 2-1 Czech Republic is m002.
    expect(results.m002).toMatchObject({ homeGoals: 2, awayGoals: 1, status: 'finished' });
  });

  it('ignores scorelines whose teams are unknown', async () => {
    const results = await syncResults({
      sources: ['http://example.test/cup.txt'],
      fetchImpl: fakeFetch(SAMPLE),
    });
    // Only the two real matches should be present.
    expect(Object.keys(results)).toHaveLength(2);
  });

  it('throws when the source cannot be fetched', async () => {
    await expect(
      syncResults({
        sources: ['http://example.test/cup.txt'],
        fetchImpl: fakeFetch('', false, 404),
      }),
    ).rejects.toThrow(/404/);
  });

  it('maps knockout lines by their official match number', async () => {
    const finals = `
▪ Round of 32
Sun Jun 28
  (73) 12:00 UTC-7  Spain 2-1 France   @ Los Angeles (Inglewood)
`;
    const results = await syncResults({
      sources: ['http://example.test/cup_finals.txt'],
      fetchImpl: fakeFetch(finals),
    });
    // Match number 73 is m073 regardless of which teams actually play.
    expect(results.m073).toMatchObject({ homeGoals: 2, awayGoals: 1, status: 'finished' });
  });

  it('maps a TheSportsDB live event to a match with status "live"', async () => {
    // m006 is Brazil v Morocco (group C).
    const payload = JSON.stringify({
      events: [
        {
          strHomeTeam: 'Brazil',
          strAwayTeam: 'Morocco',
          intHomeScore: '1',
          intAwayScore: '0',
          strStatus: '2H',
        },
      ],
    });
    const results = await syncResults({
      sources: [{ kind: 'thesportsdb', url: 'http://example.test/season.json' }],
      fetchImpl: fakeJsonFetch(payload),
    });
    expect(results.m006).toMatchObject({ homeGoals: 1, awayGoals: 0, status: 'live' });
  });

  it('normalises name spelling differences across sources', async () => {
    // Our dataset spells it "Bosnia & Herzegovina"; TheSportsDB uses a hyphen.
    const payload = JSON.stringify({
      events: [
        {
          strHomeTeam: 'Canada',
          strAwayTeam: 'Bosnia-Herzegovina',
          intHomeScore: '1',
          intAwayScore: '1',
          strStatus: 'FT',
        },
      ],
    });
    const results = await syncResults({
      sources: [{ kind: 'thesportsdb', url: 'http://example.test/season.json' }],
      fetchImpl: fakeJsonFetch(payload),
    });
    // Canada v Bosnia & Herzegovina is m003.
    expect(results.m003).toMatchObject({ homeGoals: 1, awayGoals: 1, status: 'finished' });
  });

  it('never lets a live score overwrite a finished one', async () => {
    const finished = `
Wed June 11
  13:00 UTC-6     Mexico  2-0 (1-0)  South Africa  @ Mexico City
`;
    const livePayload = JSON.stringify({
      events: [
        {
          strHomeTeam: 'Mexico',
          strAwayTeam: 'South Africa',
          intHomeScore: '0',
          intAwayScore: '0',
          strStatus: '1H',
        },
      ],
    });
    const fetchImpl = ((url: string) =>
      Promise.resolve(
        url.endsWith('.txt')
          ? ({ ok: true, status: 200, text: async () => finished } as Response)
          : ({ ok: true, status: 200, json: async () => JSON.parse(livePayload) } as Response),
      )) as unknown as typeof fetch;

    const results = await syncResults({
      sources: [
        'http://example.test/cup.txt',
        { kind: 'thesportsdb', url: 'http://example.test/season.json' },
      ],
      fetchImpl,
    });
    expect(results.m001).toMatchObject({ homeGoals: 2, awayGoals: 0, status: 'finished' });
  });

  it('succeeds when one source fails as long as another returns data', async () => {
    const finished = `
Wed June 11
  13:00 UTC-6     Mexico  2-0 (1-0)  South Africa  @ Mexico City
`;
    const fetchImpl = ((url: string) =>
      Promise.resolve(
        url.endsWith('.txt')
          ? ({ ok: true, status: 200, text: async () => finished } as Response)
          : ({ ok: false, status: 503, json: async () => ({}) } as Response),
      )) as unknown as typeof fetch;

    const results = await syncResults({
      sources: [
        'http://example.test/cup.txt',
        { kind: 'thesportsdb', url: 'http://example.test/season.json' },
      ],
      fetchImpl,
    });
    expect(results.m001).toMatchObject({ homeGoals: 2, awayGoals: 0 });
  });
});
