// On-demand results sync. Fetches the openfootball World Cup source text from a
// trusted, CORS-enabled mirror (GitHub raw) and maps the parsed scorelines onto
// our match ids. Only group-stage matches (concrete team pairs) are resolved
// here; knockout results depend on bracket resolution (Phase 6).
//
// Network access happens ONLY when sync() is invoked (e.g. a "Sync" button).

import type { Result } from '../types';
import { matches as allMatches, teams } from '../data';
import { parseResultsText } from './resultsParser';

export const DEFAULT_RESULT_SOURCES = [
  'https://raw.githubusercontent.com/openfootball/worldcup/master/2026--usa/cup.txt',
];

export interface SyncOptions {
  sources?: string[];
  fetchImpl?: typeof fetch;
}

const nameToId = new Map(teams.map((t) => [t.name, t.id] as const));

// Unique (homeTeamId|awayTeamId) -> matchId for group-stage fixtures.
const pairToMatchId = new Map<string, string>();
for (const m of allMatches) {
  if (m.stage === 'group' && m.home.kind === 'team' && m.away.kind === 'team') {
    pairToMatchId.set(`${m.home.teamId}|${m.away.teamId}`, m.id);
  }
}

/**
 * Fetch the configured source(s) and return a `matchId -> Result` map of all
 * finished group-stage matches found. Throws if a source cannot be fetched.
 */
export async function syncResults(
  options: SyncOptions = {},
): Promise<Record<string, Result>> {
  const sources = options.sources ?? DEFAULT_RESULT_SOURCES;
  const doFetch = options.fetchImpl ?? fetch;
  const results: Record<string, Result> = {};

  for (const url of sources) {
    const response = await doFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch results (${response.status}) from ${url}`);
    }
    const text = await response.text();
    for (const parsed of parseResultsText(text)) {
      const homeId = nameToId.get(parsed.homeName);
      const awayId = nameToId.get(parsed.awayName);
      if (!homeId || !awayId) continue;
      const matchId = pairToMatchId.get(`${homeId}|${awayId}`);
      if (!matchId) continue;
      results[matchId] = {
        matchId,
        homeGoals: parsed.homeGoals,
        awayGoals: parsed.awayGoals,
        status: 'finished',
      };
    }
  }

  return results;
}
