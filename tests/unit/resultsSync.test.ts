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
});
