// One-time data generator. Parses the openfootball source files
// (src/data/source/*.txt) into a typed dataset at src/data/generated.ts.
//
// Run with:  node scripts/build-data.mjs
//
// Source: github.com/openfootball/worldcup  (2026--usa), retrieved 2026-06-12.
// Re-run after updating the source .txt files to refresh results/fixtures.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src', 'data', 'source');

// id, name (must match the source spelling exactly), flagcdn code, emoji, group
const TEAM_META = [
  ['mexico', 'Mexico', 'mx', '🇲🇽', 'A'],
  ['south-africa', 'South Africa', 'za', '🇿🇦', 'A'],
  ['south-korea', 'South Korea', 'kr', '🇰🇷', 'A'],
  ['czech-republic', 'Czech Republic', 'cz', '🇨🇿', 'A'],
  ['canada', 'Canada', 'ca', '🇨🇦', 'B'],
  ['bosnia-herzegovina', 'Bosnia & Herzegovina', 'ba', '🇧🇦', 'B'],
  ['qatar', 'Qatar', 'qa', '🇶🇦', 'B'],
  ['switzerland', 'Switzerland', 'ch', '🇨🇭', 'B'],
  ['brazil', 'Brazil', 'br', '🇧🇷', 'C'],
  ['morocco', 'Morocco', 'ma', '🇲🇦', 'C'],
  ['haiti', 'Haiti', 'ht', '🇭🇹', 'C'],
  ['scotland', 'Scotland', 'gb-sct', '🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', 'C'],
  ['usa', 'USA', 'us', '🇺🇸', 'D'],
  ['paraguay', 'Paraguay', 'py', '🇵🇾', 'D'],
  ['australia', 'Australia', 'au', '🇦🇺', 'D'],
  ['turkey', 'Turkey', 'tr', '🇹🇷', 'D'],
  ['germany', 'Germany', 'de', '🇩🇪', 'E'],
  ['curacao', 'Curaçao', 'cw', '🇨🇼', 'E'],
  ['ivory-coast', 'Ivory Coast', 'ci', '🇨🇮', 'E'],
  ['ecuador', 'Ecuador', 'ec', '🇪🇨', 'E'],
  ['netherlands', 'Netherlands', 'nl', '🇳🇱', 'F'],
  ['japan', 'Japan', 'jp', '🇯🇵', 'F'],
  ['sweden', 'Sweden', 'se', '🇸🇪', 'F'],
  ['tunisia', 'Tunisia', 'tn', '🇹🇳', 'F'],
  ['belgium', 'Belgium', 'be', '🇧🇪', 'G'],
  ['egypt', 'Egypt', 'eg', '🇪🇬', 'G'],
  ['iran', 'Iran', 'ir', '🇮🇷', 'G'],
  ['new-zealand', 'New Zealand', 'nz', '🇳🇿', 'G'],
  ['spain', 'Spain', 'es', '🇪🇸', 'H'],
  ['cape-verde', 'Cape Verde', 'cv', '🇨🇻', 'H'],
  ['saudi-arabia', 'Saudi Arabia', 'sa', '🇸🇦', 'H'],
  ['uruguay', 'Uruguay', 'uy', '🇺🇾', 'H'],
  ['france', 'France', 'fr', '🇫🇷', 'I'],
  ['senegal', 'Senegal', 'sn', '🇸🇳', 'I'],
  ['iraq', 'Iraq', 'iq', '🇮🇶', 'I'],
  ['norway', 'Norway', 'no', '🇳🇴', 'I'],
  ['argentina', 'Argentina', 'ar', '🇦🇷', 'J'],
  ['algeria', 'Algeria', 'dz', '🇩🇿', 'J'],
  ['austria', 'Austria', 'at', '🇦🇹', 'J'],
  ['jordan', 'Jordan', 'jo', '🇯🇴', 'J'],
  ['portugal', 'Portugal', 'pt', '🇵🇹', 'K'],
  ['dr-congo', 'DR Congo', 'cd', '🇨🇩', 'K'],
  ['uzbekistan', 'Uzbekistan', 'uz', '🇺🇿', 'K'],
  ['colombia', 'Colombia', 'co', '🇨🇴', 'K'],
  ['england', 'England', 'gb-eng', '🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', 'L'],
  ['croatia', 'Croatia', 'hr', '🇭🇷', 'L'],
  ['ghana', 'Ghana', 'gh', '🇬🇭', 'L'],
  ['panama', 'Panama', 'pa', '🇵🇦', 'L'],
];

const nameToId = new Map(TEAM_META.map(([id, name]) => [name, id]));

const MONTHS = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Jun: 5, Jul: 6, Aug: 7,
  Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FINALS_STAGE = [
  ['Round of 32', 'round32'],
  ['Round of 16', 'round16'],
  ['Quarter-final', 'quarter'],
  ['Semi-final', 'semi'],
  ['Match for third place', 'third'],
  ['Final', 'final'],
];

function toIsoUtc(year, monthIndex, day, hhmm, tzOffsetHours) {
  const [h, m] = hhmm.split(':').map(Number);
  const localAsUtc = Date.UTC(year, monthIndex, day, h, m);
  const realUtc = localAsUtc - tzOffsetHours * 3600 * 1000;
  return new Date(realUtc).toISOString();
}

function parseDateLine(line) {
  // e.g. "Thu June 11" or "Sun Jun 28"
  const m = line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Za-z]+)\s+(\d{1,2})$/);
  if (!m) return null;
  const monthIndex = MONTHS[m[2]];
  if (monthIndex === undefined) return null;
  return { monthIndex, day: Number(m[3]) };
}

const MATCH_RE =
  /^(?:\((\d+)\)\s*)?(\d{1,2}:\d{2})\s+UTC([+-]\d+)\s+(.*?)\s+@\s+(.+?)\s*$/;

function refFor(token) {
  const id = nameToId.get(token);
  if (id) return { kind: 'team', teamId: id };
  return { kind: 'placeholder', label: token };
}

function parseMiddle(middle) {
  const cleaned = middle.replace(/\s+/g, ' ').trim();
  const scored = cleaned.match(/^(.+?)\s+(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s+(.+)$/);
  if (scored) {
    return {
      home: refFor(scored[1].trim()),
      away: refFor(scored[4].trim()),
      result: { homeGoals: Number(scored[2]), awayGoals: Number(scored[3]) },
    };
  }
  const parts = cleaned.split(/\s+v\s+/);
  if (parts.length !== 2) throw new Error(`Cannot parse middle: "${middle}"`);
  return { home: refFor(parts[0].trim()), away: refFor(parts[1].trim()), result: null };
}

function startsWithMatch(line) {
  return MATCH_RE.test(line);
}

function parseFile(text, { defaultStage }) {
  const matches = [];
  let stage = defaultStage;
  let groupId = null;
  let roundLabel = '';
  let date = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('=')) continue;

    if (line.startsWith('▪')) {
      const label = line.slice(1).trim();
      const groupMatch = label.match(/^Group ([A-L])$/);
      if (groupMatch) {
        stage = 'group';
        groupId = groupMatch[1];
        roundLabel = `Group ${groupId}`;
        date = null;
        continue;
      }
      const finals = FINALS_STAGE.find(([name]) => label.startsWith(name));
      if (finals) {
        stage = finals[1];
        groupId = null;
        roundLabel = finals[0];
        date = null;
        continue;
      }
      // Matchday legend lines like "▪ Matchday 1 | Thu Jun 11" — ignore.
      continue;
    }

    const d = parseDateLine(line);
    if (d) {
      date = d;
      continue;
    }

    if (startsWithMatch(line)) {
      if (!date) throw new Error(`Match line without a date: "${line}"`);
      const m = line.match(MATCH_RE);
      const [, num, time, tz, middle, venue] = m;
      const { home, away, result } = parseMiddle(middle);
      matches.push({
        number: num ? Number(num) : null,
        stage,
        groupId,
        roundLabel,
        kickoff: toIsoUtc(2026, date.monthIndex, date.day, time, Number(tz)),
        venue: venue.trim(),
        home,
        away,
        officialResult: result,
      });
    }
  }
  return matches;
}

const cup = readFileSync(join(srcDir, 'cup.txt'), 'utf8');
const finals = readFileSync(join(srcDir, 'cup_finals.txt'), 'utf8');

const groupMatches = parseFile(cup, { defaultStage: 'group' });
const finalsMatches = parseFile(finals, { defaultStage: 'round32' });

// Group matches have no official numbers in the source; assign 1..72 in
// chronological order. Finals keep their explicit (73..104) numbers.
groupMatches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
groupMatches.forEach((mt, i) => {
  mt.number = i + 1;
});

const allMatches = [...groupMatches, ...finalsMatches].map((mt) => ({
  id: `m${String(mt.number).padStart(3, '0')}`,
  ...mt,
}));
allMatches.sort((a, b) => a.number - b.number);

const teams = TEAM_META.map(([id, name, countryCode, flag, groupId]) => ({
  id,
  name,
  countryCode,
  flag,
  groupId,
}));

const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(
  (id) => ({ id, teamIds: teams.filter((t) => t.groupId === id).map((t) => t.id) }),
);

// ---- validation ----
const errors = [];
if (teams.length !== 48) errors.push(`expected 48 teams, got ${teams.length}`);
groups.forEach((g) => {
  if (g.teamIds.length !== 4) errors.push(`group ${g.id} has ${g.teamIds.length} teams`);
});
if (groupMatches.length !== 72) errors.push(`expected 72 group matches, got ${groupMatches.length}`);
if (finalsMatches.length !== 32) errors.push(`expected 32 finals matches, got ${finalsMatches.length}`);
allMatches.forEach((mt) => {
  if (Number.isNaN(Date.parse(mt.kickoff))) errors.push(`bad kickoff for ${mt.id}`);
});
if (errors.length) {
  console.error('Validation failed:\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}

const header = `// AUTO-GENERATED by scripts/build-data.mjs — DO NOT EDIT BY HAND.
// Source: github.com/openfootball/worldcup (2026--usa), retrieved 2026-06-12.
// Re-run: node scripts/build-data.mjs
import type { Team, Group, Match } from '../types';
`;

const body =
  header +
  `\nexport const teams: Team[] = ${JSON.stringify(teams, null, 2)};\n` +
  `\nexport const groups: Group[] = ${JSON.stringify(groups, null, 2)};\n` +
  `\nexport const matches: Match[] = ${JSON.stringify(allMatches, null, 2)};\n`;

writeFileSync(join(root, 'src', 'data', 'generated.ts'), body);
console.log(
  `Generated src/data/generated.ts: ${teams.length} teams, ${groups.length} groups, ${allMatches.length} matches ` +
    `(${groupMatches.length} group + ${finalsMatches.length} knockout).`,
);
