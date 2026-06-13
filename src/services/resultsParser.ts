// Pure parser for the openfootball World Cup source text (`cup.txt`).
// Extracts finished match scorelines. Team names are returned verbatim (as they
// appear in the source); mapping names to team ids happens in the sync service
// so this stays a pure, easily testable string transform.

export interface ParsedResult {
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
}

// A fixture line looks like:
//   "  13:00 UTC-6     Mexico  2-0 (1-0)  South Africa        @ Mexico City"
// Unplayed matches use "<home>  v  <away>" instead of a score and are ignored.
const LINE_RE =
  /^(?:\(\d+\)\s*)?\d{1,2}:\d{2}\s+UTC[+-]\d+\s+(.*?)\s+@\s+.+$/;
const SCORE_RE = /^(.+?)\s+(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s+(.+)$/;

/** Parse openfootball `cup.txt` text into the list of finished-match scorelines. */
export function parseResultsText(text: string): ParsedResult[] {
  const out: ParsedResult[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const lineMatch = LINE_RE.exec(line);
    if (!lineMatch) continue;
    const middle = lineMatch[1].replace(/\s+/g, ' ').trim();
    const scored = SCORE_RE.exec(middle);
    if (!scored) continue;
    out.push({
      homeName: scored[1].trim(),
      homeGoals: Number(scored[2]),
      awayGoals: Number(scored[3]),
      awayName: scored[4].trim(),
    });
  }
  return out;
}
