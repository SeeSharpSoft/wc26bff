// Pure knockout-bracket resolution.
//
// Knockout participants start as placeholder labels and resolve as the
// tournament progresses:
//   "1A" / "2A"  -> winner / runner-up of group A (once the group is complete)
//   "W74" / "L101" -> winner / loser of match number 74 / 101
//   "3A/B/C/D/F"  -> one of the best third-placed teams (NOT resolved here; the
//                    official allocation depends on a fixed FIFA combination
//                    table — left as a descriptive placeholder for now)
//
// Resolution is iterated to a fixpoint because later matches depend on earlier
// ones (e.g. W89 needs W74/W77 resolved first). Draws with no goal difference
// (penalty shootouts) cannot pick a winner from the score alone and stay
// unresolved.

import type { Match, Result, TeamRef } from '../types';
import { computeGroupStandings } from './standings';

export type ResolvedRefs = Record<string, { home: TeamRef; away: TeamRef }>;

const GROUP_POS_RE = /^([12])([A-L])$/;
const WINNER_RE = /^W(\d+)$/;
const LOSER_RE = /^L(\d+)$/;

function teamRef(teamId: string): TeamRef {
  return { kind: 'team', teamId };
}

function groupIds(matches: Match[]): string[] {
  const ids = new Set<string>();
  for (const m of matches) {
    if (m.stage === 'group' && m.groupId) ids.add(m.groupId);
  }
  return [...ids];
}

function groupTeamIds(matches: Match[], groupId: string): string[] {
  const ids = new Set<string>();
  for (const m of matches) {
    if (m.groupId !== groupId) continue;
    if (m.home.kind === 'team') ids.add(m.home.teamId);
    if (m.away.kind === 'team') ids.add(m.away.teamId);
  }
  return [...ids];
}

function groupComplete(
  matches: Match[],
  groupId: string,
  results: Record<string, Result>,
): boolean {
  const groupMatches = matches.filter((m) => m.groupId === groupId);
  return (
    groupMatches.length > 0 &&
    groupMatches.every((m) => results[m.id]?.status === 'finished')
  );
}

/**
 * Resolve every match's home/away refs as far as the current results allow.
 * Unresolvable refs are returned unchanged (still placeholders).
 */
export function computeBracket(
  matches: Match[],
  results: Record<string, Result>,
): ResolvedRefs {
  // Group winners / runners-up, computed once per completed group.
  const groupPlaces = new Map<string, string[]>(); // groupId -> [winnerId, runnerUpId]
  for (const groupId of groupIds(matches)) {
    if (!groupComplete(matches, groupId, results)) continue;
    const standings = computeGroupStandings(
      groupTeamIds(matches, groupId),
      matches,
      results,
    );
    groupPlaces.set(groupId, [standings[0]?.teamId, standings[1]?.teamId]);
  }

  const byNumber = new Map<number, Match>(matches.map((m) => [m.number, m]));

  // Working copy of resolved refs, seeded from the static placeholders.
  const refs: ResolvedRefs = {};
  for (const m of matches) {
    refs[m.id] = { home: m.home, away: m.away };
  }

  const resolveLabel = (label: string): TeamRef | undefined => {
    const group = GROUP_POS_RE.exec(label);
    if (group) {
      const places = groupPlaces.get(group[2]);
      if (!places) return undefined;
      const teamId = group[1] === '1' ? places[0] : places[1];
      return teamId ? teamRef(teamId) : undefined;
    }

    const winner = WINNER_RE.exec(label);
    const loser = LOSER_RE.exec(label);
    const numStr = winner?.[1] ?? loser?.[1];
    if (numStr) {
      const source = byNumber.get(Number(numStr));
      if (!source) return undefined;
      const result = results[source.id];
      if (!result || result.status !== 'finished') return undefined;
      const sourceRefs = refs[source.id];
      const home = sourceRefs.home.kind === 'team' ? sourceRefs.home.teamId : undefined;
      const away = sourceRefs.away.kind === 'team' ? sourceRefs.away.teamId : undefined;
      if (!home || !away) return undefined;
      if (result.homeGoals === result.awayGoals) return undefined; // shootout: unknown
      const homeWon = result.homeGoals > result.awayGoals;
      const winnerId = homeWon ? home : away;
      const loserId = homeWon ? away : home;
      return teamRef(winner ? winnerId : loserId);
    }

    return undefined;
  };

  // Iterate to a fixpoint: resolving one match can unlock later ones.
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of matches) {
      for (const side of ['home', 'away'] as const) {
        const current = refs[m.id][side];
        if (current.kind === 'team') continue;
        const resolved = resolveLabel(current.label);
        if (resolved) {
          refs[m.id][side] = resolved;
          changed = true;
        }
      }
    }
  }

  return refs;
}
