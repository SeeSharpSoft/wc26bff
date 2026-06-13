# World Cup 2026 — Friends Betting

A browser-only web app where a group of friends predict the outcomes of the
**FIFA World Cup 2026** matches. Pick a scoreline for every game, lock in your bets
before kickoff, switch between users, and compare everyone's guesses against the real
results in viewer mode.

- **No backend** — all user data is stored in the browser (`localStorage`).
- Scoring: exact score = **3 points**, correct tendency (win/draw/loss) = **1 point**,
  otherwise **0**.
- **Official results** are pulled on demand (the **Sync results** button) from a trusted
  public source ([openfootball](https://github.com/openfootball/worldcup)) and cached
  locally; this is the only feature that needs internet access.

Built with **Vite + React 19 + TypeScript**. For architecture, data model, and
conventions see [`DEVELOPMENT.md`](./DEVELOPMENT.md); for the roadmap see
[`TODO.md`](./TODO.md).

> **Status:** Phases 1–6 complete — tournament data, multi-user betting with kickoff
> locking, on-demand results sync with scoring + standings, viewer mode +
> leaderboard (bets revealed only after kickoff), and the knockout bracket with
> automatic placeholder resolution.

---

## Prerequisites

- **Node.js ≥ 20** (developed on Node 24) and **npm ≥ 10**.

## Install

```bash
npm install
```

To run the end-to-end tests you also need the Playwright browser (one-time):

```bash
npx playwright install chromium
```

## Run in development mode

Starts the Vite dev server with hot-module reloading:

```bash
npm run dev
```

Then open the printed URL (default <http://localhost:5173>).

## Build for deployment

Type-checks the project and produces an optimized static bundle in `dist/`:

```bash
npm run build
```

Preview the production build locally before deploying:

```bash
npm run preview
```

The contents of `dist/` are fully static and can be served by any static host
(e.g. GitHub Pages, Netlify, Vercel, or any web server).

## Run the tests

| Command | What it runs |
|---------|--------------|
| `npm test` | **Unit tests** (Jest + ts-jest) in `tests/unit/` |
| `npm run test:e2e` | **End-to-end / frontend tests** (Playwright, Chromium) in `tests/e2e/` |
| `npm run lint` | ESLint over the codebase |

Notes:
- `npm run test:e2e` automatically starts the dev server (via the Playwright config),
  so you don't need to run `npm run dev` separately. Make sure the Chromium browser is
  installed first (see [Install](#install)).
- Run a single Playwright test in headed/debug mode with
  `npx playwright test --headed` or `npx playwright test --ui`.

## Regenerate tournament data

The teams, groups, and schedule are generated from the raw source files in
`src/data/source/` into `src/data/generated.ts`:

```bash
npm run data:build
```

Edit the source `.txt` files (or `TEAM_META` in `scripts/build-data.mjs`) and re-run
this command to refresh the dataset — never edit `src/data/generated.ts` by hand.

## Project scripts (summary)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server (HMR). |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run Jest unit tests. |
| `npm run test:e2e` | Run Playwright browser tests. |
| `npm run data:build` | Regenerate the static tournament dataset. |
