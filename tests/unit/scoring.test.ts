import { describe, expect, it } from '@jest/globals';
import { scoreBet } from '../../src/utils/scoring';

describe('scoreBet', () => {
  it('awards 3 for an exact scoreline', () => {
    expect(scoreBet({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 })).toBe(3);
    expect(scoreBet({ homeGoals: 0, awayGoals: 0 }, { homeGoals: 0, awayGoals: 0 })).toBe(3);
  });

  it('awards 2 for the correct goal difference but wrong score', () => {
    // The example from the spec: actual 0:1, guess 1:2 — both "away by 1".
    expect(scoreBet({ homeGoals: 1, awayGoals: 2 }, { homeGoals: 0, awayGoals: 1 })).toBe(2);
    // home win by the same margin
    expect(scoreBet({ homeGoals: 3, awayGoals: 1 }, { homeGoals: 2, awayGoals: 0 })).toBe(2);
    // away win by two
    expect(scoreBet({ homeGoals: 0, awayGoals: 2 }, { homeGoals: 1, awayGoals: 3 })).toBe(2);
  });

  it('awards 1 for the correct tendency but wrong margin', () => {
    // home win predicted and happened, different margin
    expect(scoreBet({ homeGoals: 3, awayGoals: 0 }, { homeGoals: 1, awayGoals: 0 })).toBe(1);
    // away win predicted and happened, different margin
    expect(scoreBet({ homeGoals: 0, awayGoals: 1 }, { homeGoals: 1, awayGoals: 3 })).toBe(1);
    // The spec's user B: actual 0:1, guess 0:2 — away win but wrong margin.
    expect(scoreBet({ homeGoals: 0, awayGoals: 2 }, { homeGoals: 0, awayGoals: 1 })).toBe(1);
  });

  it('never awards 2 for a draw — a non-exact draw scores 1', () => {
    // draw predicted and happened (different score): margin matches but draws are excluded
    expect(scoreBet({ homeGoals: 1, awayGoals: 1 }, { homeGoals: 2, awayGoals: 2 })).toBe(1);
    expect(scoreBet({ homeGoals: 3, awayGoals: 3 }, { homeGoals: 0, awayGoals: 0 })).toBe(1);
  });

  it('awards 0 for the wrong tendency', () => {
    expect(scoreBet({ homeGoals: 2, awayGoals: 0 }, { homeGoals: 0, awayGoals: 1 })).toBe(0);
    expect(scoreBet({ homeGoals: 1, awayGoals: 1 }, { homeGoals: 2, awayGoals: 0 })).toBe(0);
    expect(scoreBet({ homeGoals: 0, awayGoals: 1 }, { homeGoals: 1, awayGoals: 1 })).toBe(0);
  });
});
