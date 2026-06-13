import { expect, test } from '@playwright/test';
import { enterViewerMode } from './helpers';

const FIXED = new Date('2026-06-15T12:00:00Z');

// Seed a user with two bets directly in storage: one on the opener m001 (already
// started + finished 2-0 in the bundled data) and one on m072 (not started yet).
const USER = { id: 'u-alice', name: 'Alice', createdAt: '2026-01-01T00:00:00.000Z' };
const BETS = {
  'u-alice': {
    m001: { userId: 'u-alice', matchId: 'm001', homeGoals: 2, awayGoals: 0, updatedAt: 'x' },
    m072: { userId: 'u-alice', matchId: 'm072', homeGoals: 1, awayGoals: 1, updatedAt: 'x' },
  },
};

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FIXED });
  await page.goto('/');
  await page.getByTestId('site-nav').waitFor();
  await page.evaluate(
    ({ user, bets }) => {
      localStorage.clear();
      localStorage.setItem('wc26.users', JSON.stringify([user]));
      localStorage.setItem('wc26.activeUserId', JSON.stringify(user.id));
      localStorage.setItem('wc26.bets', JSON.stringify(bets));
    },
    { user: USER, bets: BETS },
  );
  await page.reload();
  await page.getByTestId('site-nav').waitFor();
  await enterViewerMode(page);
});

test.describe('Viewer mode — overlay across the three pages', () => {
  test('Groups page becomes the viewer overview with leaderboard', async ({ page }) => {
    await expect(page.getByTestId('groups-page')).toBeVisible();
    await expect(page.getByTestId('active-user-banner')).toContainText('Viewer mode');

    // Leaderboard totals points across finished matches.
    await expect(page.getByTestId('leaderboard')).toBeVisible();
    await expect(page.getByTestId('leaderboard-points-u-alice')).toHaveText('3');

    // m001 has started: the bet and points are revealed.
    await expect(page.getByTestId('viewer-bets-m001')).toBeVisible();
    await expect(page.getByTestId('viewer-bet-m001-u-alice')).toContainText('2–0');
    await expect(page.getByTestId('viewer-points-m001-u-alice')).toContainText('3');

    // m072 has not started: guesses are hidden and not rendered.
    await expect(page.getByTestId('viewer-hidden-m072')).toBeVisible();
    await expect(page.getByTestId('viewer-bets-m072')).toHaveCount(0);
  });

  test('Schedule page shows guesses by date instead of inputs', async ({ page }) => {
    await page.getByTestId('site-nav').getByRole('link', { name: 'Schedule' }).click();
    await expect(page.getByTestId('schedule-page')).toBeVisible();

    // No bet inputs in viewer mode; revealed guess for the started opener instead.
    await expect(page.getByTestId('bet-m001')).toHaveCount(0);
    await expect(page.getByTestId('viewer-bet-m001-u-alice')).toContainText('2–0');
  });

  test('Knockout page shows guesses instead of inputs', async ({ page }) => {
    await page.getByTestId('site-nav').getByRole('link', { name: 'Knockout' }).click();
    await expect(page.getByTestId('knockout-page')).toBeVisible();
    await expect(page.getByTestId('viewer-stage-round32')).toBeVisible();
    // Knockout matches have not kicked off yet: guesses stay hidden.
    await expect(page.getByTestId('bet-m073')).toHaveCount(0);
  });

  test('selecting a user exits viewer mode and activates them', async ({ page }) => {
    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('select-user-u-alice').click();
    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await expect(page.getByTestId('viewer-active')).toHaveCount(0);
    await expect(page.getByTestId('active-user-banner')).toContainText('Betting as Alice');
  });
});
