// On-demand results sync. Fetches scores from CORS-enabled, key-free public
// sources and maps them onto our match ids:
//
//  - openfootball (GitHub raw text): authoritative *finished* group + knockout
//    results. Knockout lines carry an official match number "(NN)".
//  - TheSportsDB (free JSON, public test key "3"): the FIFA World Cup 2026 season
//    feed, which also surfaces *live* in-play scores. This is what gives us live
//    updates for running matches.
//
// Per-source failures are tolerated: as long as one source returns data the sync
// succeeds, so a flaky live feed never wipes out the finished results.
//
// Network access happens when sync() is invoked (the "Sync" button) and, while
// viewer mode is active, on a refresh interval (see AutoResultsSync).

import type { MatchStatus, Result } from '../types';
import { matches as allMatches, teams } from '../data';
import { parseResultsText, type ParsedResult } from './resultsParser';
import { parseTheSportsDbEvents } from './thesportsdbParser';

export type ResultSourceKind = 'openfootball' | 'thesportsdb';

export interface ResultSource {
  kind: ResultSourceKind;
  url: string;
}

export const OPENFOOTBALL_GROUP_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup/master/2026--usa/cup.txt';
export const OPENFOOTBALL_FINALS_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup/master/2026--usa/cup_finals.txt';
// FIFA World Cup (league 4429), season 2026; public free key "3".
export const THESPORTSDB_SEASON_URL =
  'https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026';

export const DEFAULT_RESULT_SOURCES: ResultSource[] = [
  { kind: 'openfootball', url: OPENFOOTBALL_GROUP_URL },
  { kind: 'openfootball', url: OPENFOOTBALL_FINALS_URL },
  { kind: 'thesportsdb', url: THESPORTSDB_SEASON_URL },
];

export interface SyncOptions {
  /** A plain string is treated as an openfootball text source (back-compat). */
  sources?: Array<ResultSource | string>;
  fetchImpl?: typeof fetch;
}

/** Collapse names so minor spelling differences across sources still match. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '');
}

const normToId = new Map(teams.map((t) => [normalizeName(t.name), t.id] as const));

// Unique (homeTeamId|awayTeamId) -> matchId for group-stage fixtures.
const pairToMatchId = new Map<string, string>();
// Official match number -> matchId (used for knockout lines that carry "(NN)").
const numberToMatchId = new Map<number, string>();
for (const m of allMatches) {
  numberToMatchId.set(m.number, m.id);
  if (m.stage === 'group' && m.home.kind === 'team' && m.away.kind === 'team') {
    pairToMatchId.set(`${m.home.teamId}|${m.away.teamId}`, m.id);
  }
}

// Higher rank wins a merge conflict: a finished score must never be replaced by a
// live or scheduled one, and a live score wins over a stale "not started".
const STATUS_RANK: Record<MatchStatus, number> = { scheduled: 0, live: 1, finished: 2 };

function toSource(src: ResultSource | string): ResultSource {
  return typeof src === 'string' ? { kind: 'openfootball', url: src } : src;
}

function matchIdFor(parsed: ParsedResult): string | undefined {
  if (parsed.number !== undefined) return numberToMatchId.get(parsed.number);
  const homeId = normToId.get(normalizeName(parsed.homeName));
  const awayId = normToId.get(normalizeName(parsed.awayName));
  if (homeId && awayId) return pairToMatchId.get(`${homeId}|${awayId}`);
  return undefined;
}

async function fetchParsed(
  source: ResultSource,
  doFetch: typeof fetch,
): Promise<ParsedResult[]> {
  const response = await doFetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch results (${response.status}) from ${source.url}`);
  }
  if (source.kind === 'thesportsdb') {
    return parseTheSportsDbEvents(await response.json());
  }
  return parseResultsText(await response.text());
}

/**
 * Fetch the configured source(s) and return a `matchId -> Result` map. Group-stage
 * lines map by team pair; knockout lines map by their official match number. Live
 * scores from TheSportsDB are tagged `status: 'live'`. Throws only if *every*
 * source fails to produce any result.
 */
export async function syncResults(
  options: SyncOptions = {},
): Promise<Record<string, Result>> {
  const sources = (options.sources ?? DEFAULT_RESULT_SOURCES).map(toSource);
  const doFetch = options.fetchImpl ?? fetch;
  const results: Record<string, Result> = {};
  const errors: Error[] = [];

  for (const source of sources) {
    try {
      for (const parsed of await fetchParsed(source, doFetch)) {
        const matchId = matchIdFor(parsed);
        if (!matchId) continue;
        const status: MatchStatus = parsed.status ?? 'finished';
        const existing = results[matchId];
        if (existing && STATUS_RANK[status] < STATUS_RANK[existing.status]) continue;
        results[matchId] = {
          matchId,
          homeGoals: parsed.homeGoals,
          awayGoals: parsed.awayGoals,
          status,
        };
      }
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  if (errors.length > 0 && Object.keys(results).length === 0) {
    throw errors[0];
  }
  return results;
}
