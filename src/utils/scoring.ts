// Scoring rules (pure). For a finished match, a bet earns:
//   - 3 points for an exact scoreline,
//   - 2 points for the correct (non-draw) goal difference when not exact,
//     e.g. guess 1:2 on an actual 0:1 (both "away by 1"),
//   - 1 point for the correct tendency (home win / draw / away win),
//   - 0 points otherwise.
// A draw guess never earns the 2-point tier: a non-exact draw scores 1 point.
// See DEVELOPMENT.md §3.

export interface ScoreLike {
  homeGoals: number;
  awayGoals: number;
}

export type BetPoints = 0 | 1 | 2 | 3;

function tendency(home: number, away: number): number {
  return Math.sign(home - away);
}

/** Points earned by `bet` against the actual `result`. */
export function scoreBet(bet: ScoreLike, result: ScoreLike): BetPoints {
  if (bet.homeGoals === result.homeGoals && bet.awayGoals === result.awayGoals) {
    return 3;
  }
  const betDiff = bet.homeGoals - bet.awayGoals;
  const resultDiff = result.homeGoals - result.awayGoals;
  // Same signed goal difference (and not a draw) → correct margin, 2 points.
  if (betDiff === resultDiff && resultDiff !== 0) {
    return 2;
  }
  if (tendency(bet.homeGoals, bet.awayGoals) === tendency(result.homeGoals, result.awayGoals)) {
    return 1;
  }
  return 0;
}
