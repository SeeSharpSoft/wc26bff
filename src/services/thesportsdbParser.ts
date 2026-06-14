// Pure parser for TheSportsDB's free JSON feed (v1, public test key "3").
//
// The `eventsseason.php?id=4429&s=2026` endpoint lists every FIFA World Cup 2026
// fixture with team names, current goals and a status string. The same feed
// surfaces in-play matches (status like "1H"/"2H"/"HT") with their live score,
// which is how we get live updates without a paid live-score endpoint.
//
// Team names are returned verbatim; mapping them to our team ids happens in the
// sync service so this stays a pure, easily testable transform.

import type { MatchStatus } from '../types';
import type { ParsedResult } from './resultsParser';

// TheSportsDB status codes that mean the match is over.
const FINISHED_STATUSES = new Set([
  'FT',
  'AET',
  'PEN',
  'AP',
  'FT_PEN',
  'Match Finished',
  'After Extra Time',
  'After Penalties',
]);

// Status codes that mean the match is currently being played.
const LIVE_STATUSES = new Set([
  '1H',
  '2H',
  'HT',
  'ET',
  'BT',
  'P',
  'LIVE',
  'INT',
  'In Progress',
  'Live',
  'First Half',
  'Second Half',
  'Half Time',
  'Extra Time',
  'Break Time',
  'Penalty',
  'Penalty In Progress',
  'Suspended',
  'Interrupted',
]);

function toGoals(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function statusOf(raw: string): MatchStatus | null {
  if (FINISHED_STATUSES.has(raw)) return 'finished';
  if (LIVE_STATUSES.has(raw)) return 'live';
  return null;
}

interface SportsDbEvent {
  strHomeTeam?: unknown;
  strAwayTeam?: unknown;
  intHomeScore?: unknown;
  intAwayScore?: unknown;
  strStatus?: unknown;
}

/**
 * Parse a TheSportsDB events payload (`{ events: [...] }`) into the list of
 * playable scorelines we care about: finished and live matches that carry a
 * score. Not-started or unknown-status events are skipped.
 */
export function parseTheSportsDbEvents(payload: unknown): ParsedResult[] {
  const events = (payload as { events?: unknown } | null)?.events;
  if (!Array.isArray(events)) return [];

  const out: ParsedResult[] = [];
  for (const raw of events as SportsDbEvent[]) {
    const homeName = typeof raw.strHomeTeam === 'string' ? raw.strHomeTeam.trim() : '';
    const awayName = typeof raw.strAwayTeam === 'string' ? raw.strAwayTeam.trim() : '';
    if (!homeName || !awayName) continue;

    const statusRaw = typeof raw.strStatus === 'string' ? raw.strStatus.trim() : '';
    const status = statusOf(statusRaw);
    if (!status) continue;

    const homeGoals = toGoals(raw.intHomeScore);
    const awayGoals = toGoals(raw.intAwayScore);
    if (homeGoals === null || awayGoals === null) continue;

    out.push({ homeName, awayName, homeGoals, awayGoals, status });
  }
  return out;
}
