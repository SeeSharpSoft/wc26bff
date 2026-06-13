// Public entry point for the static tournament dataset.
//
// Data source: github.com/openfootball/worldcup (2026--usa directory),
// retrieved 2026-06-12. Raw source files live in ./source/*.txt and are
// compiled into ./generated.ts by scripts/build-data.mjs.
//
// This dataset is READ-ONLY. User data (bets, results, users) lives in
// localStorage — see src/storage.

import type { Group, Match, Stage, Team, TeamRef } from '../types';
import { groups, matches, teams } from './generated';

export { groups, matches, teams };

const teamById = new Map(teams.map((t) => [t.id, t]));
const matchById = new Map(matches.map((m) => [m.id, m]));
const groupById = new Map(groups.map((g) => [g.id, g]));

export function getTeam(id: string): Team | undefined {
  return teamById.get(id);
}

export function getMatch(id: string): Match | undefined {
  return matchById.get(id);
}

export function getGroup(id: string): Group | undefined {
  return groupById.get(id);
}

export function getMatchesByStage(stage: Stage): Match[] {
  return matches.filter((m) => m.stage === stage);
}

export function getMatchesByGroup(groupId: string): Match[] {
  return matches.filter((m) => m.groupId === groupId);
}

/** flagcdn.com SVG URL for a team's flag. */
export function flagUrl(team: Team): string {
  return `https://flagcdn.com/${team.countryCode}.svg`;
}

/** Resolve a TeamRef to a concrete Team, or undefined if it's an unresolved placeholder. */
export function resolveTeamRef(ref: TeamRef): Team | undefined {
  return ref.kind === 'team' ? teamById.get(ref.teamId) : undefined;
}

/** Display label for a participant: team name (with flag) or placeholder text. */
export function teamRefLabel(ref: TeamRef): string {
  if (ref.kind === 'placeholder') return ref.label;
  return teamById.get(ref.teamId)?.name ?? ref.teamId;
}
