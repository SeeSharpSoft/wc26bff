// Pure group-standings computation from synced results.

import type { Match, Result } from '../types';

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

function emptyRow(teamId: string): StandingRow {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function applyResult(row: StandingRow, scored: number, conceded: number): void {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  if (scored > conceded) {
    row.won += 1;
    row.points += 3;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

/**
 * Compute the standings table for the given group teams. Only finished results
 * for matches between two of the group's teams are counted. Rows are sorted by
 * points, then goal difference, then goals for, then team id (stable tiebreak).
 */
export function computeGroupStandings(
  teamIds: string[],
  matches: Match[],
  results: Record<string, Result>,
): StandingRow[] {
  const rows = new Map(teamIds.map((id) => [id, emptyRow(id)]));

  for (const match of matches) {
    if (match.home.kind !== 'team' || match.away.kind !== 'team') continue;
    const homeId = match.home.teamId;
    const awayId = match.away.teamId;
    const homeRow = rows.get(homeId);
    const awayRow = rows.get(awayId);
    if (!homeRow || !awayRow) continue;

    const result = results[match.id];
    if (!result || result.status !== 'finished') continue;

    applyResult(homeRow, result.homeGoals, result.awayGoals);
    applyResult(awayRow, result.awayGoals, result.homeGoals);
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamId.localeCompare(b.teamId),
  );
}
