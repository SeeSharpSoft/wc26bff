# TODO.md — Implementation Plan & Progress

Status legend: ⬜ todo · 🟡 doing · ✅ done · ⏸ blocked

> Process: work through phases **one at a time**. Stop after each phase and get
> approval before continuing. Add a new goal/phase for every larger task; small
> fixes don't need planning. Keep this file and `DEVELOPMENT.md` updated.

---

## Phase 0 — Project setup & planning ✅
- [x] Scaffold Vite + React 19 + TypeScript project
- [x] Install `react-router-dom`
- [x] Verify build (`npm run build`)
- [x] Write `DEVELOPMENT.md`
- [x] Write `TODO.md` (this file) with the full phase plan

## Phase 1 — Tournament data layer ✅
Goal: model the WC2026 tournament as bundled, read-only static data.
- [x] Define domain types in `src/types.ts`
- [x] Retrieve 48 teams (name, ISO code, emoji flag) + group assignments (A–L)
- [x] Encode the 12 groups (generated into `src/data/generated.ts`)
- [x] Encode group-stage schedule (72 matches, kickoff datetimes in ISO UTC)
- [x] Encode knockout bracket (32 matches) with placeholder team refs
- [x] Record data source + retrieval date in generator + `generated.ts`
- [x] Sanity check: 48 teams, 12×4 groups, 72 + 32 matches (validated in generator)
- [x] Data generator `scripts/build-data.mjs` from `src/data/source/*.txt`
- [x] Public dataset API + helpers in `src/data/index.ts`
- [x] Phase 1 data-overview UI (`App.tsx`) as a testable foundation
- [x] **Testing setup:** Jest (unit) + Playwright (e2e)
- [x] Unit tests for data integrity (`tests/unit/data.test.ts`, 20 tests)
- [x] Playwright frontend test (`tests/e2e/overview.spec.ts`, 4 tests)

## Phase 2 — Storage & user management ✅
Goal: localStorage persistence and multi-user switching.
- [x] Typed `src/storage/localStorage.ts` wrapper + key constants (+ in-memory fallback,
      schema-version stub, corrupt/quota-safe read/write)
- [x] Pure user logic in `src/domain/users.ts` (add/remove/rename, active resolution)
- [x] User persistence accessors in `src/storage/users.ts`
- [x] `UserContext` + `UserProvider`: list users, create, switch, remove
- [x] Header with `UserSwitcher` UI (add / select / remove + active banner)
- [x] Persist + rehydrate users and active selection across reloads
- [x] Unit tests (`users.test.ts`, `storage.test.ts`) — 24 new tests
- [x] Playwright tests (`users.spec.ts`) — add/switch/persist/remove (5 tests)

## Phase 3 — Group stage UI & betting ✅
Goal: browse groups/schedule and place lockable bets for the active user.
- [x] `GroupsPage`: 12 group sections (teams + flags) with a `MatchCard` per fixture
- [x] `SchedulePage`: group matches grouped by local calendar day
- [x] `MatchCard` + `BetInput`: enter/edit score guess for active user
- [x] Locking: read-only `🔒` bet once `now >= kickoff` (`src/utils/locking.ts`)
- [x] Only show the active user's own bets here (bets scoped via `BetsProvider`)
- [x] HashRouter routing + nav links (Groups / Schedule) in `Header`
- [x] `useNow` hook so locking updates live without impure render reads
- [x] Unit tests (`bets.test.ts`, `locking.test.ts`) — 20 new tests
- [x] Playwright tests (`groups.spec.ts`, `betting.spec.ts`) — 7 tests
      (uses `page.clock` for deterministic kickoff locking)

## Phase 4 — Results sync & scoring ✅
Goal: pull official results from a trusted source on demand, store locally, and score bets.
- [x] `resultsParser.ts`: pure parser for openfootball `cup.txt` text → parsed scores
- [x] `resultsSync.ts`: fetch source (raw GitHub, CORS-ok), map to `matchId`, on-demand only
- [x] `storage/results.ts`: persist `wc26.results` + `wc26.resultsSyncedAt` timestamp
- [x] `ResultsProvider`/`useResults`: results map + sync state (idle/loading/error), seed from bundled `officialResult`
- [x] `SyncButton` in header: trigger sync, show spinner / last-synced / error
- [x] `scoring.ts`: exact=3, tendency=1, else=0 (pure, unit-tested)
- [x] `standings.ts` + `StandingsTable`: compute & show group tables from synced results
- [x] `MatchCard`: show synced result + active user's earned points once finished
- [x] Unit tests (scoring, standings, resultsParser, resultsSync with fake fetch) — 14 new
- [x] Playwright test (`results.spec.ts`): mock the source request, sync, assert result + points

## Phase 5 — Viewer mode & leaderboard ✅
Goal: compare all users' bets vs actual results + ranking.
- [x] `ViewerPage` (`/viewer`): per match, show each user's bet (only after kickoff) + actual result
- [x] Per-bet points display in viewer
- [x] `domain/leaderboard.ts` + `Leaderboard`: total points per user, ranked (pts → exact → name)
- [x] Reveal rule enforced: bets hidden until kickoff (privacy), locked thereafter
- [x] Viewer route + header nav link
- [x] Unit tests (`leaderboard.test.ts`) — 6 new
- [x] Playwright tests (`viewer.spec.ts`) — reveal/hide + leaderboard (3 tests)

## Phase 6 — Knockout stage ✅
Goal: bracket progression and knockout betting.
- [x] `Bracket`/`KnockoutPage` (`/knockout`) view R32 → R16 → QF → SF → 3rd → Final
- [x] Resolve placeholders as results come in (`domain/bracket.ts` + `BracketProvider`)
- [x] Knockout bets reuse the bet/lock/score flow (generic `MatchCard`)
- [x] Knockout results sync: `cup_finals.txt` mapped by official match number
- [x] Unit tests (`bracket.test.ts` + parser/sync extensions) — 6 new
- [x] Playwright tests (`knockout.spec.ts`) — 3 tests

## Phase 7 — Polish & hardening ⬜
Goal: production-ready quality.
- [ ] Styling pass / responsive layout
- [ ] Edge cases: storage quota, corrupt data, schema migration/versioning
- [ ] Dev "now" override for testing locking
- [ ] Unit tests for `scoring`, `locking`, `standings`
- [ ] Final `DEVELOPMENT.md` review

---

## Progress notes
- 2026-06-12: Phase 0 complete. Project scaffolded, builds clean.
- 2026-06-12: Phase 2 complete. localStorage wrapper with in-memory fallback +
  schema-version stub; pure user domain logic; `UserProvider`/`useUser` context; Header
  with `UserSwitcher` (add/switch/remove + active banner); users and active selection
  persist across reloads. Tests: 44 unit + 9 e2e all green; build + lint clean.
- 2026-06-12: Phase 3 complete. HashRouter with Groups/Schedule pages + header nav;
  pure bet logic (`domain/bets.ts`) + locking rules (`utils/locking.ts`); `BetsProvider`
  scopes bets to the active user and persists `wc26.bets`; `MatchCard`/`BetInput` enter
  & lock score guesses (read-only 🔒 after kickoff); `useNow` hook keeps locking live
  without impure render reads. Tests: 64 unit + 12 e2e all green; build + lint clean.
- 2026-06-12: Phase 4 complete. On-demand results sync from openfootball (GitHub raw,
  CORS-ok) via the header **Sync results** button → parsed (`resultsParser.ts`), mapped
  to match ids (`resultsSync.ts`), cached in `wc26.results` (+ `wc26.resultsSyncedAt`),
  seeded from bundled scores on first load (`ResultsProvider`/`useResults`). Pure scoring
  (`utils/scoring.ts`) + group standings (`domain/standings.ts`, shown via
  `StandingsTable`); `MatchCard` shows the result and the active user's points. Tests:
  78 unit + 15 e2e all green; build + lint clean.
- 2026-06-12: Phase 5 complete. Viewer mode (`/viewer`) reveals every user's bet only
  after kickoff (privacy), alongside the actual result and per-bet points; ranked
  leaderboard (`domain/leaderboard.ts` → `Leaderboard`, sorted pts → exact → name).
  Viewer nav link added. Tests: 83 unit + 18 e2e all green; build + lint clean.
- 2026-06-12: Phase 6 complete. Knockout stage live: `KnockoutPage` (`/knockout`)
  renders R32 → R16 → QF → SF → 3rd → Final, reusing `MatchCard` so betting, kickoff
  locking and scoring work unchanged. `domain/bracket.ts` resolves placeholder refs to a
  fixpoint — `1A`/`2A` from completed group standings, `W##`/`L##` from finished knockout
  results (drawn/penalty scores stay unresolved); best-third `3X` refs are intentionally
  left as placeholders (needs the official FIFA combination table). `BracketProvider`
  memoizes resolution on results; `MatchCard`/`ViewerPage` show resolved teams via
  `useBracket().getRefs`. Results sync now also pulls `cup_finals.txt`, mapping knockout
  scores by official match number. Tests: 89 unit + 21 e2e all green; build + lint clean.
  Awaiting approval to start Phase 7 (polish & hardening).
