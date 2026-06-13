// Domain model — single source of truth for the WC26 betting app.
// See DEVELOPMENT.md section 3 for rationale.

export type Stage =
  | 'group'
  | 'round32'
  | 'round16'
  | 'quarter'
  | 'semi'
  | 'third'
  | 'final';

export const STAGES: Stage[] = [
  'group',
  'round32',
  'round16',
  'quarter',
  'semi',
  'third',
  'final',
];

export interface Team {
  /** Stable slug id, e.g. "south-korea". */
  id: string;
  /** Display name, e.g. "South Korea". */
  name: string;
  /** flagcdn.com country code (ISO 3166-1 alpha-2, or "gb-eng"/"gb-sct"). */
  countryCode: string;
  /** Emoji flag, used inline / as fallback. */
  flag: string;
  /** Group letter "A".."L". */
  groupId: string;
}

export interface Group {
  /** Group letter "A".."L". */
  id: string;
  /** The four team ids belonging to this group. */
  teamIds: string[];
}

/**
 * Reference to a match participant. Group-stage participants are concrete teams;
 * knockout participants start as placeholders (e.g. "2A", "W74", "3A/B/C/D/F")
 * and are resolved as the tournament progresses (Phase 6).
 */
export type TeamRef =
  | { kind: 'team'; teamId: string }
  | { kind: 'placeholder'; label: string };

/** Official result baked into the static dataset for already-finished matches. */
export interface OfficialResult {
  homeGoals: number;
  awayGoals: number;
}

export interface Match {
  /** Stable id, e.g. "m001" / "m104". */
  id: string;
  /** Official match number 1..104. */
  number: number;
  stage: Stage;
  /** Group letter for group-stage matches, otherwise null. */
  groupId: string | null;
  /** Human-readable round label, e.g. "Group A" / "Round of 32". */
  roundLabel: string;
  /** Kickoff time as ISO 8601 UTC string (stored in UTC; displayed in local time). */
  kickoff: string;
  venue: string;
  home: TeamRef;
  away: TeamRef;
  /** Final score if the match is already finished in the source data, else null. */
  officialResult: OfficialResult | null;
}

// ----- User-entered data (persisted in localStorage) -----

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface Bet {
  userId: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  updatedAt: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Result {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  status: MatchStatus;
}
