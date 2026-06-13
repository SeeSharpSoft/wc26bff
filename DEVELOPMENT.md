# DEVELOPMENT.md — WC26 Betting App

> Developer handbook. Keep this file up to date as the project evolves. Any new
> architectural decision, data-structure change, or convention belongs here.
>
> (The project owner referred to this file as `DEVELOPEMENT.md`; the conventional
> spelling `DEVELOPMENT.md` is used here.)

---

## 1. Project goal

A browser-only web app where a group of friends predict the outcomes of the
**FIFA World Cup 2026** matches, similar to common football betting/tipping sites.

Core requirements:

- See the **group stage** groupings and place a score guess for every match.
- Guesses can be edited until the match **kicks off**; after kickoff they are **locked**.
- After the group stage, the **knockout/final rounds** follow.
- **Multiple users** share the same browser. You can **switch the active user**; each
  user only sees their own guesses while betting.
- A **viewer mode** shows every user's guesses next to the **actual results**.
  - A user's guess is revealed in viewer mode **only once the match has started**.
- **Scoring**: exact score = **3 points**, correct tendency (home win / draw / away win)
  = **1 point**, otherwise **0 points**.
- **All data is stored in the browser** (localStorage). No backend, no network calls
  for user data.

---

## 2. Tech stack & rationale

| Concern        | Choice                         | Why |
|----------------|--------------------------------|-----|
| Build tool     | Vite                           | Fast dev server, simple config. |
| UI             | React 19 + TypeScript          | Type safety for data model; another dev can continue safely. |
| Routing        | react-router-dom               | Multiple views (groups, schedule, knockout, viewer). |
| State          | React Context + custom hooks   | Small app; avoids extra deps. Persisted to localStorage. |
| Persistence    | `localStorage` via typed wrapper | Requirement: all data in browser. |
| Styling        | Plain CSS / CSS Modules        | Keep dependencies minimal (revisit if a UI lib is wanted). |

> If state grows complex, consider Zustand with the `persist` middleware. Not added
> yet to keep the dependency surface small.

---

## 3. Domain model & data structures

All shared types live in `src/types.ts`. Draft model (finalised in Phase 1):

```ts
type Stage = 'group' | 'round32' | 'round16' | 'quarter' | 'semi' | 'third' | 'final';

interface Team {
  id: string;            // stable slug, e.g. "usa"
  name: string;          // display name, e.g. "United States"
  countryCode: string;   // ISO 3166-1 alpha-2, e.g. "us" (for flag CDN)
  flag: string;          // emoji flag, fallback/inline use
  groupId: string | null;// "A".."L" for group-stage teams
}

interface Group {
  id: string;            // "A".."L"
  teamIds: string[];     // 4 team ids
}

// A scheduled fixture. For knockout games the participants may be unknown
// at data-authoring time and are represented by placeholders.
interface Match {
  id: string;            // stable id, e.g. "m-001"
  stage: Stage;
  groupId: string | null;
  roundLabel: string;    // human label, e.g. "Group A — MD1" / "Round of 32"
  kickoff: string;       // ISO 8601 datetime (UTC) — drives locking
  home: TeamRef;         // resolved team id OR placeholder ("Winner Group A")
  away: TeamRef;
}

type TeamRef =
  | { kind: 'team'; teamId: string }
  | { kind: 'placeholder'; label: string };  // resolved as knockout progresses

// ----- User-entered data (localStorage) -----

interface User {
  id: string;            // uuid
  name: string;
  createdAt: string;     // ISO
}

interface Bet {
  userId: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  updatedAt: string;     // ISO
}

// Actual results (entered by an organiser; see Phase 4).
interface Result {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  status: 'scheduled' | 'live' | 'finished';
}
```

### Scoring rules (`src/utils/scoring.ts`)
For a finished match with actual `(aH, aA)` and a bet `(bH, bA)`:
- `bH === aH && bA === aA` → **3**
- `sign(bH - bA) === sign(aH - aA)` → **1**
- else → **0**

### Locking rules (`src/utils/locking.ts`)
A bet is editable iff `now() < match.kickoff` **and** result status is `scheduled`.
After kickoff the bet is read-only. Viewer mode reveals a user's bet iff
`now() >= match.kickoff` (match has started).

---

## 4. Storage layout (localStorage keys)

Namespaced under the `wc26` prefix (`STORAGE_PREFIX`) to avoid collisions. All access
goes through `src/storage/localStorage.ts` (`KEYS`, `readJSON`, `writeJSON`, …), which
falls back to an in-memory store if `localStorage` is unavailable (SSR, Safari private
mode) and tolerates missing/corrupt values.

| Key                     | Value | Status |
|-------------------------|-------|--------|
| `wc26.schemaVersion`    | `number` (currently `1`) | implemented |
| `wc26.users`            | `User[]` | implemented (Phase 2) |
| `wc26.activeUserId`     | `string \| null` (resolved active user) | implemented (Phase 2) |
| `wc26.bets`             | `Record<userId, Record<matchId, Bet>>` | Phase 3 |
| `wc26.results`          | `Record<matchId, Result>` | Phase 4 |

Schema versioning: `ensureSchemaVersion()` records `SCHEMA_VERSION` on first run; bump
it and add a migration when the persisted shape changes.

Static tournament data (`teams`, `groups`, `matches`) is **bundled code**, not
localStorage, and is treated as read-only.

---

## 5. Planned file structure

```
src/
  data/            # static tournament dataset (read-only)
    source/          # raw openfootball .txt sources (cup.txt, cup_finals.txt)
    generated.ts     # AUTO-GENERATED teams/groups/matches — do not edit
    index.ts         # public API + helpers (getTeam, flagUrl, resolveTeamRef, …)
  storage/         # localStorage.ts (typed wrapper + keys + fallback); users.ts accessors
  domain/          # pure logic: users.ts (add/remove/rename/active resolution)
  context/         # UserContext.ts (context+useUser hook), UserProvider.tsx; BetsContext later
  components/      # Header, UserSwitcher; GroupTable/MatchCard/Bracket/Leaderboard (Phase 3+)
  pages/           # (Phase 3+) GroupsPage, SchedulePage, KnockoutPage, ViewerPage
  utils/           # time.ts (local-tz formatting); scoring/locking/standings in Phase 4+
  types.ts         # domain model (single source of truth)
  App.tsx          # current screen: Header + data overview (router added in Phase 3)
  main.tsx         # mounts <UserProvider><App/></UserProvider>
scripts/
  build-data.mjs   # source .txt -> src/data/generated.ts generator
tests/
  unit/            # Jest unit tests (data, users, storage; later scoring/locking)
  e2e/             # Playwright browser tests (overview, users)
```

Context split note: `UserContext.ts` (context object + `useUser` hook) is intentionally
separate from `UserProvider.tsx` (component) so React Fast Refresh / the
`react-refresh/only-export-components` lint rule stays happy.

---

## 6. Tournament data sourcing

WC 2026: **48 teams**, **12 groups (A–L)** of 4, hosts USA/Canada/Mexico.
Group stage = 72 matches, then Round of 32 → R16 → QF → SF → 3rd place → Final
(32 knockout matches), **104 total**.

- **Source:** [openfootball/worldcup](https://github.com/openfootball/worldcup),
  directory `2026--usa` (files `cup.txt`, `cup_finals.txt`), retrieved **2026-06-12**.
  Copied verbatim into `src/data/source/`.
- Built into `src/data/generated.ts` by `scripts/build-data.mjs` (see §9).
- Kickoff times in the source carry a UTC offset (e.g. `13:00 UTC-6`) and are
  normalised to ISO-8601 UTC at generation time.
- **Finished matches:** the source already contains scores for matches played before
  the retrieval date. These are parsed into `Match.officialResult` and act as a seed
  for actual results. The tournament is live (Jun 11 – Jul 19, 2026), so kickoff-based
  locking already locks past matches.
- Flags: `Team.countryCode` is a flagcdn code (`flagUrl()` → `https://flagcdn.com/{code}.svg`);
  England/Scotland use `gb-eng`/`gb-sct`. An emoji `flag` is also stored as fallback.
- **Risk:** dataset accuracy. The source + retrieval date are recorded in
  `generated.ts` and `scripts/build-data.mjs`; re-run the generator to refresh.

---

## 7. Conventions & rules

- **TypeScript strict**; no `any` in domain code.
- Domain logic (scoring, locking, standings) lives in pure functions under `utils/`
  and must be unit-testable without React.
- Components stay presentational; persistence goes through the storage layer / context.
- Never write user data anywhere but localStorage (no network).
- **Dates & times — store in UTC, display in local time.** All timestamps are persisted
  as ISO-8601 UTC strings, but everything shown to the user MUST be rendered in the
  **browser's local timezone**. Always format through the helpers in `src/utils/time.ts`
  (`formatDateTime`, `formatDate`, `formatTime`, `localTimeZoneLabel`) — never hard-code
  a `timeZone` (e.g. `'UTC'`) in display code. Locking/scoring comparisons still operate
  on the UTC instants, which is timezone-independent.
- Keep `DEVELOPMENT.md` and `TODO.md` updated at the end of every phase.

---

## 8. Important files

| File | Purpose |
|------|---------|
| `DEVELOPMENT.md` | This handbook. |
| `TODO.md` | Phased implementation plan & progress. |
| `src/types.ts` | Single source of truth for the domain model. |
| `src/data/index.ts` | Public dataset API + helpers + data-source note. |
| `src/data/generated.ts` | Generated teams/groups/matches (do not edit). |
| `scripts/build-data.mjs` | Generates the dataset from `src/data/source/*.txt`. |
| `src/storage/localStorage.ts` | Typed localStorage wrapper, keys, fallback, schema version. |
| `src/domain/users.ts` | Pure user logic (add/remove/rename, active resolution). |
| `src/context/UserProvider.tsx` | User state + persistence; `useUser` in `UserContext.ts`. |
| `src/components/UserSwitcher.tsx` | Add / switch / remove users UI. |
| `src/utils/time.ts` | Date/time formatting in the browser's local timezone. |
| `src/utils/scoring.ts` | Points calculation. *(Phase 4)* |
| `src/utils/locking.ts` | Bet lock / reveal rules. *(Phase 4)* |

---

## 9. Local development

```bash
npm install      # install deps
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # production build (also type-checks via tsc -b)
npm run lint     # eslint
npm run preview  # preview production build
npm run data:build  # regenerate src/data/generated.ts from src/data/source/*.txt
npm test            # Jest unit tests (tests/unit)
npm run test:e2e    # Playwright browser tests (tests/e2e)
```

### Testing setup
- **Unit tests — Jest + ts-jest** (`tests/unit/**/*.test.ts`). Config: `jest.config.mjs`
  with a dedicated `tsconfig.jest.json` (compiles the ESM/TS source to CommonJS for the
  test run). Pure domain logic (data integrity, later scoring/locking/standings) is
  tested here. Run via `npm test`.
- **E2E / frontend tests — Playwright** (`tests/e2e/**/*.spec.ts`). Config:
  `playwright.config.ts`; it auto-starts the Vite dev server. Browser: chromium
  (install once with `npx playwright install chromium`). Components expose
  `data-testid` hooks for stable selectors. Run via `npm run test:e2e`.

### Data generation
Tournament data is **generated**, not hand-written:
- Raw source: `src/data/source/cup.txt` (groups + group-stage fixtures, incl. any
  played results) and `src/data/source/cup_finals.txt` (knockout bracket). These come
  from [openfootball/worldcup](https://github.com/openfootball/worldcup) `2026--usa`,
  retrieved 2026-06-12.
- `scripts/build-data.mjs` parses them, converts kickoff times to ISO-8601 UTC,
  attaches `TEAM_META` (ids/flags/country codes), validates counts (48 teams, 12×4
  groups, 72 + 32 matches), and writes `src/data/generated.ts`.
- `src/data/index.ts` is the public API (helpers like `getTeam`, `getMatchesByGroup`,
  `flagUrl`, `resolveTeamRef`). **Never edit `generated.ts` by hand** — edit the source
  files or `TEAM_META` and re-run `npm run data:build`.

---

## 10. Decisions log

- **2026-06-12** Stack chosen: Vite + React 19 + TS + react-router-dom. State via
  React Context + localStorage wrapper (no external state lib yet).
- **2026-06-12** Static tournament data bundled in code; only user data in localStorage.
- **2026-06-12** (Phase 1) Data is generated from openfootball source files via
  `scripts/build-data.mjs` rather than hand-authored — reproducible and verifiable.
- **2026-06-12** (Phase 1) Knockout participants modelled as `TeamRef` placeholders
  (`2A`, `W74`, `3A/B/C/D/F`, `L101`) to be resolved in Phase 6.
- **2026-06-12** (Phase 1) Already-finished matches keep their score in
  `Match.officialResult` as a seed; the canonical editable results live in localStorage
  (Phase 4).
- **2026-06-12** (Phase 1) Testing: Jest (unit) + Playwright (e2e). ts-jest compiles to
  CJS via `tsconfig.jest.json`.
- **2026-06-12** Dates/times stored in UTC, displayed in the browser's local timezone
  via `src/utils/time.ts` (see §7).
- **2026-06-12** (Phase 2) Storage wrapper falls back to in-memory when `localStorage`
  is unavailable, making it robust (Safari private mode) and unit-testable under Node.
- **2026-06-12** (Phase 2) Active user is **derived** (`resolveActiveUserId`) from the
  user list + an explicit selection, rather than corrected via a state-setting effect
  (avoids `react-hooks/set-state-in-effect`).
- **Open:** how organisers enter actual results (dedicated results/admin screen) —
  decide in Phase 4.
- **Open:** dev-time "now" override to test locking before/around real kickoff times.
