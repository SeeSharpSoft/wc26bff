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
  - Viewer mode is a **global, non-user-specific view toggle** (top entry of the user
    menu), not a separate route. While active it overlays the three main pages: Groups
    becomes a viewer overview (leaderboard + group guesses), Schedule shows guesses by
    date, and Knockout shows guesses per round — all read-only.
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
| Routing        | react-router-dom               | Main views (groups, schedule, knockout); viewer mode overlays these via context. |
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
| `wc26.bets`             | `Record<userId, Record<matchId, Bet>>` | implemented (Phase 3) |
| `wc26.results`          | `Record<matchId, Result>` | implemented (Phase 4) |
| `wc26.resultsSyncedAt`  | `string \| null` (ISO of last successful sync) | implemented (Phase 4) |
| `wc26.devNow`           | `string \| null` (ISO dev clock override) | implemented (Phase 7, dev-only) |

Schema versioning: `ensureSchemaVersion()` records `SCHEMA_VERSION` on first run; bump
it and add a migration when the persisted shape changes.

**Robustness (Phase 7):** `writeJSON` never throws — it returns `false` and records the
message in `getLastStorageError()` when a write fails (e.g. quota exceeded), so the app
keeps running on in-memory state. Reads are sanitised through `src/storage/validation.ts`
(`sanitizeUsers`/`sanitizeBets`/`sanitizeResults`), which drop any malformed or tampered
records rather than trusting raw JSON — a single corrupt entry can never crash the app.

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
  storage/         # localStorage.ts (typed wrapper + keys + fallback); users.ts, bets.ts, results.ts; validation.ts (sanitisers)
  domain/          # pure logic: users.ts, bets.ts, standings.ts, leaderboard.ts, bracket.ts, stages.ts
  services/        # resultsParser.ts (pure text→scores), resultsSync.ts (fetch+map, on-demand)
  context/         # *Context.ts (context+hook) + *Provider.tsx pairs: User…, Bets…, Results…, Bracket…, ViewerMode…
  components/      # Header, UserMenu, AboutDialog, icons, MatchCard, BetInput, ViewerMatch, StandingsTable, Leaderboard, DevClock
  pages/           # GroupsPage, SchedulePage, KnockoutPage (each renders a viewer variant when viewer mode is on), PointsPage
  hooks/           # useNow.ts (interval-refreshed clock for live locking; honours dev override)
  utils/           # time.ts (local-tz formatting), locking.ts, scoring.ts, devClock.ts (dev-only now override)
  types.ts         # domain model (single source of truth)
  App.tsx          # HashRouter + active-user bar; routes: / (Groups), /schedule, /knockout, /points
  main.tsx         # <UserProvider><ResultsProvider><BracketProvider><BetsProvider><ViewerModeProvider><App/></…>
scripts/
  build-data.mjs   # source .txt -> src/data/generated.ts generator
tests/
  unit/            # Jest: data, users, storage, bets, locking, time, scoring, standings, leaderboard, resultsParser, resultsSync, bracket, validation, devClock
  e2e/             # Playwright: groups, betting, users, results, viewer, knockout, dev-clock
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
- **Reading "now" — use `useNow()`**, never `Date.now()` in a render body (the
  `react-hooks/purity` rule forbids it). `useNow` also honours the dev clock override
  (`utils/devClock.ts`), so any time-derived UI (locking, reveal) can be tested by setting
  a fixed instant via the dev-only `DevClock` control.
- **Trust nothing from localStorage.** It is user-writable and survives across versions, so
  sanitise on read (`storage/validation.ts`) and treat writes as fallible (`writeJSON`
  returns a success flag; check `getLastStorageError()` to warn the user).
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
| `src/domain/bets.ts` | Pure immutable bet logic over `BetsByUser` (get/set/clear). |
| `src/context/UserProvider.tsx` | User state + persistence; `useUser` in `UserContext.ts`. |
| `src/context/BetsProvider.tsx` | Bet state scoped to active user; `useBets` in `BetsContext.ts`. |
| `src/components/UserMenu.tsx` | Top-right user/options popup: current user, switch, delete (trash), add user, results sync, and About — closes on any action. |
| `src/components/AboutDialog.tsx` | Modal describing the app (browser-only, sync needed) with a GitHub repo link. |
| `src/components/icons.tsx` | Inline SVG icon set (user, users, trash, plus, sync, chevron, info, external-link, close). |
| `src/components/MatchCard.tsx` | One fixture: teams/flags, kickoff (local tz), result/LIVE, bet, points. |
| `src/components/BetInput.tsx` | Score-guess inputs; read-only 🔒 once locked. |
| `src/components/StandingsTable.tsx` | Group table computed from synced results. |
| `src/components/Leaderboard.tsx` | Ranked total points per user. |
| `src/services/resultsParser.ts` | Pure parser: openfootball `cup.txt` text → scorelines. |
| `src/services/resultsSync.ts` | Fetch trusted source + map scorelines to match ids. |
| `src/context/ResultsProvider.tsx` | Results map + sync state; `useResults` in `ResultsContext.ts`. |
| `src/domain/standings.ts` | Pure group-standings computation. |
| `src/domain/leaderboard.ts` | Pure leaderboard (points/exact/tendency per user, ranked). |
| `src/pages/PointsPage.tsx` | Points tab (`/points`): the ranked `Leaderboard` (mode-agnostic). |
| `src/pages/GroupsPage.tsx` | 12 group sections (heading + `StandingsTable` + matches). Same structure in both modes; renders `MatchCard`s (betting) or `ViewerMatch`es (viewer). |
| `src/pages/SchedulePage.tsx` | Group matches grouped by local calendar day. Same structure in both modes; renders `MatchCard`s (betting) or `ViewerMatch`es (viewer). |
| `src/components/ViewerMatch.tsx` | Read-only match card: fixture + actual result + every user's guess (revealed only after kickoff). Shared by all viewer-mode pages. |
| `src/context/ViewerModeProvider.tsx` | Global viewer-mode toggle (not persisted); `useViewerMode` in `ViewerModeContext.ts`. |
| `src/pages/KnockoutPage.tsx` | Knockout stage (`/knockout`): R32→Final sections. Same structure in both modes; renders `MatchCard`s (betting) or `ViewerMatch`es (viewer). |
| `src/domain/bracket.ts` | Pure `computeBracket(matches, results)`: resolves placeholder refs to a fixpoint. |
| `src/domain/stages.ts` | `KNOCKOUT_STAGES` ordered list (excludes group). |
| `src/context/BracketProvider.tsx` | Memoizes bracket resolution; `useBracket().getRefs` in `BracketContext.ts`. |
| `src/hooks/useNow.ts` | Interval-refreshed clock so locking updates while the page is open. |
| `src/utils/time.ts` | Date/time formatting in the browser's local timezone. |
| `src/utils/locking.ts` | Bet lock / reveal rules (pure, time-injectable). |
| `src/utils/scoring.ts` | Points calculation (exact=3, tendency=1, else=0). |
| `src/utils/devClock.ts` | Dev-only "now" override (`getDevNow`/`setDevNow`/`resolveNow`); `useNow` honours it. |
| `src/components/DevClock.tsx` | Dev-only Header control to set/clear the clock override (gated on `import.meta.env.DEV`). |
| `src/storage/validation.ts` | Runtime sanitisers for persisted users/bets/results (drop corrupt records). |

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
- **2026-06-12** (Phase 3) Routing via **HashRouter** (not BrowserRouter) so the app
  works on static hosts / GitHub Pages without server rewrites.
- **2026-06-12** (Phase 3) Bets stored as `Record<userId, Record<matchId, Bet>>`;
  `BetsProvider` exposes get/set/clear already scoped to the active user, so UI never
  sees other users' bets while betting.
- **2026-06-12** (Phase 3) `BetInput`'s editable draft is remounted (`key={activeUser.id}`)
  on user switch so inputs reset to the newly selected user's stored bet.
- **2026-06-12** (Phase 3) Time is read through a `useNow` hook (state initializer +
  interval), never `Date.now()` in render, to satisfy `react-hooks/purity` and keep
  locking live. Props must not be named `ref` (reserved) — see `Participant.teamRef`.
- **2026-06-12** (Phase 3) Playwright locking tests use `page.clock.install({ time })`
  for deterministic kickoff comparisons independent of the real wall clock.
- **2026-06-12** (Phase 4) Official results are **pulled on demand** (a Sync button),
  never automatically, from openfootball's `cup.txt` on GitHub raw — same provenance as
  the bundled dataset, served with `access-control-allow-origin: *` (browser-fetchable)
  and no API key. Parsed results are cached in `wc26.results` and seeded from the bundled
  `officialResult` scores on first load. Only group-stage (concrete team pairs) are
  resolved; knockout result mapping waits on bracket resolution (Phase 6).
- **2026-06-12** (Phase 4) Sync = pure parser (`resultsParser.ts`) + a thin
  fetch/map service (`resultsSync.ts`, injectable `fetchImpl` for tests); Playwright
  mocks the source via `page.route` so e2e never touches the network.
- **2026-06-12** (Phase 5) Viewer mode enforces the privacy rule with `isBetRevealed`
  (= match started): before kickoff no user's bet is rendered at all; after kickoff every
  user's bet, the result and per-bet points are shown. Leaderboard is a pure reduction
  (`domain/leaderboard.ts`) over `allBets` × finished results, ranked by points → exact
  hits → name. The viewer e2e seeds users/bets directly into `localStorage` to exercise
  reveal of an already-started match.
- **2026-06-12** (Phase 6) Knockout placeholders resolve through a pure fixpoint in
  `domain/bracket.ts`: `1A`/`2A` from a **completed** group's standings, `W##`/`L##` from
  finished knockout results (iterated since later matches reference earlier winners). A
  drawn knockout score leaves the winner unresolved because the goal score alone can't
  capture a penalty shootout. Best-third refs (`3A/B/C/D/F`) are **deliberately not
  resolved** — that needs FIFA's official third-place combination table; they stay as
  placeholders. `BracketProvider` memoizes resolution on `results`; UI reads it via
  `useBracket().getRefs(matchId)` (falls back to the match's own refs). Knockout fixtures
  reuse `MatchCard`, so betting/locking/scoring are unchanged.
- **2026-06-12** (Phase 6) Results sync also pulls `cup_finals.txt`; knockout lines carry
  official numbers `(NN)` so they map by `match.number`, while group lines (no number) map
  by team pair. `resultsParser` tolerates penalty annotations like `(1-1, 4-2 pen)`.
- **2026-06-13** (Phase 7) Added a **dev-only clock override** (`utils/devClock.ts`): when
  set, `useNow()` returns a fixed instant instead of the wall clock so kickoff locking can
  be exercised by hand. State lives in `wc26.devNow`; a `wc26:devnow` custom event (plus the
  cross-tab `storage` event) makes open components update immediately. The `DevClock`
  control is rendered only when `import.meta.env.DEV` (never in production builds). Pure
  logic (`resolveNow`) is reused by `useNow`, keeping render bodies free of `Date.now()`.
- **2026-06-13** (Phase 7) **Storage hardening.** `writeJSON` returns a success boolean and
  records the last failure (`getLastStorageError`) rather than silently swallowing quota
  errors. All reads are sanitised (`storage/validation.ts`) so malformed/tampered entries
  are dropped instead of crashing the app; `localStorage` being user-writable and
  version-spanning makes this the trust boundary. Schema migrations still hang off
  `ensureSchemaVersion()`.
- **2026-06-13** (UX) Consolidated user management + the results-sync action into a single
  top-right **`UserMenu`** popup (replacing the separate `UserSwitcher` and `SyncButton`).
  The trigger shows the active user's name (or "No users yet"); the popup lists every user
  (click a name to activate, trash icon to delete), an add-user input (Enter or the ＋
  button), and the sync action. **Any action closes the popup** (switch/add/delete/sync),
  and it also closes on outside-click or Escape. Icons are inline SVGs in
  `components/icons.tsx` (no icon dependency). e2e helpers (`tests/e2e/helpers.ts`):
  `openUserMenu`/`addUser`/`switchUser`/`deleteUser`/`syncResults` drive it; specs reopen
  the menu when they need to read the post-sync status (since sync closes it).
- **2026-06-13** (UX) Added an **About this app** item to the user menu that opens
  `AboutDialog` — a modal with a concise, non-technical summary (browser-only storage,
  results need syncing) and a link to the repository
  (`https://github.com/SeeSharpSoft/wc26bff`). Closes on the ✕ button, outside-click, or
  Escape.
- **2026-06-13** (Deploy) Hosted on **GitHub Pages** at
  `https://seesharpsoft.github.io/wc26bff`. The production build sets Vite `base` to
  `/wc26bff/` (only for `command === 'build'`; dev + e2e stay on `/`). HashRouter means no
  SPA-fallback/404 config is needed on Pages. CI (`.github/workflows/ci.yml`) runs
  lint + unit + build + e2e; deploy (`.github/workflows/deploy.yml`) builds and publishes
  `dist/` via the Pages "GitHub Actions" source on every push to `main`. `package.json`
  carries the full metadata (name, version, description, license MIT, author, homepage,
  repository, bugs, keywords); `LICENSE` added.
- **2026-06-13** (UX) **Viewer mode reworked into a global view toggle**, presented like a
  selectable user. It is no longer a separate `/viewer` route/nav link; instead it is a
  **"Viewer mode" entry at the top of the user list** in the user menu, backed by
  `ViewerModeProvider` (in-memory, not persisted). Selecting it activates viewer mode and
  **deactivates any active user** (it carries the "active" tag, no real user does);
  selecting a real user (or adding one) **exits viewer mode** and activates that user — so
  viewer mode and a personal user are mutually exclusive, exactly like switching users. When
  on, the three main pages render read-only viewer variants: Groups → a viewer overview
  (leaderboard + group guesses), Schedule → the same date-grouped layout but showing guesses,
  Knockout → the same round sections showing guesses. All variants reuse the shared
  `ViewerMatch` component, which keeps the privacy rule (`isMatchStarted`): guesses stay
  hidden and locked until kickoff. The trigger and active-user bar reflect viewer mode. e2e
  helper `enterViewerMode` selects the entry; exiting is just `switchUser`.
- **2026-06-13** (UX) Moved the **leaderboard to its own `Points` tab** (`/points`,
  `PointsPage`) and removed it from the Groups viewer. The leaderboard is not user-specific,
  so the Points tab renders the same in both betting and viewer mode. First step toward
  aligning the viewer and betting views around the same page structure/navigation.
- **2026-06-13** (UX) **Unified page layout across betting and viewer mode.** All three
  pages (Groups, Schedule, Knockout) now render identical scaffolding in both modes —
  same `<h1>`, group/stage/day sections, section headings, and (on Groups) `StandingsTable`.
  The **only** per-mode difference is the matches container: a `.match-grid` of `MatchCard`s
  (betting, with inputs) vs a `.viewer-group` stack of `ViewerMatch`es (viewer, showing
  guesses, still hidden until kickoff). Intro text differs per mode where the betting copy
  doesn't fit. The betting view is the leading UI: the viewer variant mirrors it, not the
  other way around. Section testids are shared (`group-section-*`, `knockout-stage-*`).

- **2026-06-13** (UX) **Project icon = the `⚽` emoji.** `public/favicon.svg` renders the
  soccer-ball emoji via an SVG `<text>` element (so the browser tab shows the platform's
  emoji); the same emoji is the in-app header brand mark and the About-dialog mark. (An
  earlier custom `IconBall` SVG was tried and reverted — the emoji reads better at small
  sizes.) The favicon href in `index.html` is base-path-rewritten by Vite (e.g.
  `/wc26bff/favicon.svg`) in the production build.
- **2026-06-13** (UX) Browser **title is `BetForFun WC26`** (`index.html`); the in-app brand
  name matches. The brand name now **stays visible below 640px** (previously hidden on mobile).
- **2026-06-13** (Rule) **User display names are capped at 10 characters.** Enforced in the
  pure domain (`makeUser`/`renameUser` slice to `MAX_USER_NAME_LENGTH = 10` in
  `domain/users.ts`) and on the add-user input (`maxLength`). Keep this cap in mind for any
  new name entry points.
