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

## Phase 3 — Group stage UI & betting ⬜
Goal: browse groups/schedule and place lockable bets for the active user.
- [ ] `GroupsPage`: 12 group tables (teams + flags)
- [ ] `SchedulePage`: matches grouped by matchday/date
- [ ] `MatchCard` + `BetInput`: enter/edit score guess for active user
- [ ] Locking: disable editing once `now >= kickoff`
- [ ] Only show the active user's own bets here

## Phase 4 — Results entry & scoring ⬜
Goal: record actual results and compute points.
- [ ] Results entry mechanism (organiser/admin screen) — confirm UX with owner
- [ ] `scoring.ts`: exact=3, tendency=1, else=0 (pure, unit-tested)
- [ ] `standings.ts`: compute group tables from actual results
- [ ] Match status (scheduled/live/finished) handling

## Phase 5 — Viewer mode & leaderboard ⬜
Goal: compare all users' bets vs actual results + ranking.
- [ ] `ViewerPage`: per match, show each user's bet (only if match started) + actual result
- [ ] Per-bet points display
- [ ] `Leaderboard`: total points per user, ranked
- [ ] Confirm locked bets are read-only everywhere

## Phase 6 — Knockout stage ⬜
Goal: bracket progression and knockout betting.
- [ ] `Bracket` view R32 → R16 → QF → SF → 3rd → Final
- [ ] Resolve placeholders as results come in
- [ ] Knockout bets reuse the bet/lock/score flow

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
  Awaiting approval to start Phase 3 (group stage UI & betting).
