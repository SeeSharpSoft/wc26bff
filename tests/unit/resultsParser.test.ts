import { describe, expect, it } from '@jest/globals';
import { parseResultsText } from '../../src/services/resultsParser';

const SAMPLE = `
Group A | Mexico  South Africa  South Korea  Czech Republic

Thu June 11
  13:00 UTC-6     Mexico  2-0 (1-0)  South Africa        @ Mexico City
  20:00 UTC-6     South Korea  2-1 (0-0)  Czech Republic     @ Guadalajara

Thu June 18
  12:00 UTC-4     Czech Republic    v South Africa   @ Atlanta
  19:00 UTC-6     Mexico            v South Korea    @ Guadalajara
`;

describe('parseResultsText', () => {
  it('extracts only the finished (scored) matches', () => {
    const results = parseResultsText(SAMPLE);
    expect(results).toHaveLength(2);
  });

  it('parses home/away names and goals', () => {
    const [first] = parseResultsText(SAMPLE);
    expect(first).toEqual({
      homeName: 'Mexico',
      awayName: 'South Africa',
      homeGoals: 2,
      awayGoals: 0,
    });
  });

  it('handles multi-word team names', () => {
    const results = parseResultsText(SAMPLE);
    expect(results[1]).toEqual({
      homeName: 'South Korea',
      awayName: 'Czech Republic',
      homeGoals: 2,
      awayGoals: 1,
    });
  });

  it('ignores non-fixture lines', () => {
    expect(parseResultsText('= World Cup 2026\n# a comment\n\n')).toEqual([]);
  });

  it('captures the match number and penalty annotation on knockout lines', () => {
    const finals = `
▪ Round of 32
Sun Jun 28
  (89) 17:00 UTC-4  Spain 1-1 (1-1, 4-2 pen)  France   @ Philadelphia
  (90) 12:00 UTC-5  W73 v W75   @ Houston
`;
    const results = parseResultsText(finals);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      number: 89,
      homeName: 'Spain',
      awayName: 'France',
      homeGoals: 1,
      awayGoals: 1,
    });
  });
});
