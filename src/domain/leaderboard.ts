// Pure leaderboard computation. Totals each user's points across all finished
// matches they placed a bet on. See DEVELOPMENT.md §3 for the scoring rules.

import type { Result, User } from '../types';
import type { BetsByUser } from './bets';
import { getUserBets } from './bets';
import { scoreBet } from '../utils/scoring';

export interface LeaderboardRow {
  userId: string;
  name: string;
  points: number;
  /** Number of exact-score (3-point) hits. */
  exact: number;
  /** Number of correct goal-difference (2-point) hits. */
  diff: number;
  /** Number of correct-tendency (1-point) hits. */
  tendency: number;
  /** Finished matches the user placed a bet on. */
  played: number;
}

/**
 * Rank users by total points (then exact hits, then name) over the finished
 * results. Only finished results count; only matches the user actually bet on
 * contribute to `played`.
 */
export function computeLeaderboard(
  users: User[],
  allBets: BetsByUser,
  results: Record<string, Result>,
): LeaderboardRow[] {
  const finished = Object.values(results).filter((r) => r.status === 'finished');

  const rows = users.map((user) => {
    const bets = getUserBets(allBets, user.id);
    let points = 0;
    let exact = 0;
    let diff = 0;
    let tendency = 0;
    let played = 0;

    for (const result of finished) {
      const bet = bets[result.matchId];
      if (!bet) continue;
      played += 1;
      const p = scoreBet(bet, result);
      points += p;
      if (p === 3) exact += 1;
      else if (p === 2) diff += 1;
      else if (p === 1) tendency += 1;
    }

    return { userId: user.id, name: user.name, points, exact, diff, tendency, played };
  });

  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      b.diff - a.diff ||
      a.name.localeCompare(b.name),
  );
}
