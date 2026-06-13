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

Namespaced under a single prefix to avoid collisions. Draft:

| Key                     | Value |
|-------------------------|-------|
| `wc26.users`            | `User[]` |
| `wc26.activeUserId`     | `string \| null` |
| `wc26.bets`             | `Record<userId, Record<matchId, Bet>>` |
| `wc26.results`          | `Record<matchId, Result>` |
| `wc26.settings`         | misc (e.g. dev "now" override) |

Static tournament data (`teams`, `groups`, `matches`) is **bundled code**, not
localStorage, and is treated as read-only.

---

## 5. Planned file structure

```
src/
  data/            # static tournament dataset (read-only)
    teams.ts
    groups.ts
    matches.ts
    index.ts
  storage/
    localStorage.ts  # typed get/set wrapper + key constants
  context/
    UserContext.tsx  # active user, user list, switching
    BetsContext.tsx  # bets + results CRUD, persisted
  hooks/
  components/
    Header.tsx / UserSwitcher.tsx
    GroupTable.tsx
    MatchCard.tsx / BetInput.tsx
    Bracket.tsx
    Leaderboard.tsx
  pages/
    GroupsPage.tsx
    SchedulePage.tsx
    KnockoutPage.tsx
    ViewerPage.tsx
  utils/
    scoring.ts
    locking.ts
    standings.ts   # compute group tables from results
    time.ts        # now() (with optional dev override)
  types.ts
  App.tsx          # router + providers
```

---

## 6. Tournament data sourcing

WC 2026: **48 teams**, **12 groups (A–L)** of 4, hosts USA/Canada/Mexico.
Group stage = 72 matches, then Round of 32 → R16 → QF → SF → 3rd place → Final.

- Teams, the official draw (Dec 2025), and the kickoff schedule are captured as
  static data in `src/data/` during **Phase 1**.
- Flags: use ISO country code with a flag CDN (e.g. `https://flagcdn.com/{code}.svg`)
  and keep an emoji fallback on the `Team`.
- **Risk:** dataset accuracy. The source used and the retrieval date must be recorded
  in `src/data/index.ts` as a comment so it can be re-verified.

---

## 7. Conventions & rules

- **TypeScript strict**; no `any` in domain code.
- Domain logic (scoring, locking, standings) lives in pure functions under `utils/`
  and must be unit-testable without React.
- Components stay presentational; persistence goes through the storage layer / context.
- Never write user data anywhere but localStorage (no network).
- Keep `DEVELOPMENT.md` and `TODO.md` updated at the end of every phase.

---

## 8. Important files

| File | Purpose |
|------|---------|
| `DEVELOPMENT.md` | This handbook. |
| `TODO.md` | Phased implementation plan & progress. |
| `src/types.ts` | Single source of truth for the domain model. |
| `src/data/index.ts` | Bundled tournament dataset + data-source note. |
| `src/utils/scoring.ts` | Points calculation. |
| `src/utils/locking.ts` | Bet lock / reveal rules. |

---

## 9. Local development

```bash
npm install      # install deps
npm run dev      # start Vite dev server
npm run build    # production build (also type-checks)
npm run lint     # eslint
npm run preview  # preview production build
```

---

## 10. Decisions log

- **2026-06-12** Stack chosen: Vite + React 19 + TS + react-router-dom. State via
  React Context + localStorage wrapper (no external state lib yet).
- **2026-06-12** Static tournament data bundled in code; only user data in localStorage.
- **Open:** how organisers enter actual results (dedicated results/admin screen) —
  decide in Phase 4.
- **Open:** dev-time "now" override to test locking before/around real kickoff times.
