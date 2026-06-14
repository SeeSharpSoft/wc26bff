// Scoring rules (pure). For a finished match, a bet earns:
//   - 3 points for an exact scoreline,
//   - 1 point for the correct tendency (home win / draw / away win),
//   - 0 points otherwise.
// See DEVELOPMENT.md §3.

export interface ScoreLike {
  homeGoals: number;
  awayGoals: number;
}

export type BetPoints = 0 | 1 | 3;

function tendency(home: number, away: number): number {
  return Math.sign(home - away);
}

/** Points earned by `bet` against the actual `result`. */
export function scoreBet(bet: ScoreLike, result: ScoreLike): BetPoints {
  if (bet.homeGoals === result.homeGoals && bet.awayGoals === result.awayGoals) {
    return 3;
  }
  if (tendency(bet.homeGoals, bet.awayGoals) === tendency(result.homeGoals, result.awayGoals)) {
    return 1;
  }
  return 0;
}
