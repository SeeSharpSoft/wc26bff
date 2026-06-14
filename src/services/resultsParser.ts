// Pure parser for the openfootball World Cup source text (`cup.txt`).
// Extracts finished match scorelines. Team names are returned verbatim (as they
// appear in the source); mapping names to team ids happens in the sync service
// so this stays a pure, easily testable string transform.

import type { MatchStatus } from '../types';

export interface ParsedResult {
  /** Official match number when the source line carries one (e.g. knockout "(89)"). */
  number?: number;
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
  /** Match state for this scoreline. Omitted by sources that only report finished games. */
  status?: MatchStatus;
}

// A fixture line looks like:
//   "  13:00 UTC-6     Mexico  2-0 (1-0)  South Africa        @ Mexico City"
//   "  (89) 17:00 UTC-4  Spain 2-1 France   @ Philadelphia"   (knockouts)
// Unplayed matches use "<home>  v  <away>" instead of a score and are ignored.
const LINE_RE =
  /^(?:\((\d+)\)\s*)?\d{1,2}:\d{2}\s+UTC[+-]\d+\s+(.*?)\s+@\s+.+$/;
const SCORE_RE = /^(.+?)\s+(\d+)-(\d+)(?:\s+\([^)]*\))?\s+(.+)$/;

/** Parse openfootball source text into the list of finished-match scorelines. */
export function parseResultsText(text: string): ParsedResult[] {
  const out: ParsedResult[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const lineMatch = LINE_RE.exec(line);
    if (!lineMatch) continue;
    const middle = lineMatch[2].replace(/\s+/g, ' ').trim();
    const scored = SCORE_RE.exec(middle);
    if (!scored) continue;
    const parsed: ParsedResult = {
      homeName: scored[1].trim(),
      homeGoals: Number(scored[2]),
      awayGoals: Number(scored[3]),
      awayName: scored[4].trim(),
      status: 'finished',
    };
    if (lineMatch[1]) parsed.number = Number(lineMatch[1]);
    out.push(parsed);
  }
  return out;
}
