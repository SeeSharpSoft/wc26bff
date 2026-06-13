import { describe, expect, it } from '@jest/globals';
import { scoreBet } from '../../src/utils/scoring';

describe('scoreBet', () => {
  it('awards 3 for an exact scoreline', () => {
    expect(scoreBet({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 })).toBe(3);
    expect(scoreBet({ homeGoals: 0, awayGoals: 0 }, { homeGoals: 0, awayGoals: 0 })).toBe(3);
  });

  it('awards 1 for the correct tendency but wrong score', () => {
    // home win predicted and happened
    expect(scoreBet({ homeGoals: 3, awayGoals: 0 }, { homeGoals: 1, awayGoals: 0 })).toBe(1);
    // away win predicted and happened
    expect(scoreBet({ homeGoals: 0, awayGoals: 2 }, { homeGoals: 1, awayGoals: 3 })).toBe(1);
    // draw predicted and happened (different score)
    expect(scoreBet({ homeGoals: 1, awayGoals: 1 }, { homeGoals: 2, awayGoals: 2 })).toBe(1);
  });

  it('awards 0 for the wrong tendency', () => {
    expect(scoreBet({ homeGoals: 2, awayGoals: 0 }, { homeGoals: 0, awayGoals: 1 })).toBe(0);
    expect(scoreBet({ homeGoals: 1, awayGoals: 1 }, { homeGoals: 2, awayGoals: 0 })).toBe(0);
    expect(scoreBet({ homeGoals: 0, awayGoals: 1 }, { homeGoals: 1, awayGoals: 1 })).toBe(0);
  });
});
