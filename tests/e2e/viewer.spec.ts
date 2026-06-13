import { expect, test } from '@playwright/test';

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
  await page.getByTestId('site-nav').getByRole('link', { name: 'Viewer' }).click();
  await expect(page.getByTestId('viewer-page')).toBeVisible();
});

test.describe('Phase 5 — viewer mode & leaderboard', () => {
  test('reveals bets only after kickoff', async ({ page }) => {
    // m001 has started: the bet and points are revealed.
    await expect(page.getByTestId('viewer-bets-m001')).toBeVisible();
    await expect(page.getByTestId('viewer-bet-m001-u-alice')).toContainText('2–0');
    await expect(page.getByTestId('viewer-points-m001-u-alice')).toContainText('3');

    // m072 has not started: bets are hidden and not rendered.
    await expect(page.getByTestId('viewer-hidden-m072')).toBeVisible();
    await expect(page.getByTestId('viewer-bets-m072')).toHaveCount(0);
    await expect(page.getByTestId('viewer-bet-m072-u-alice')).toHaveCount(0);
  });

  test('shows the actual result next to the fixture', async ({ page }) => {
    await expect(page.getByTestId('viewer-result-m001')).toContainText('2');
  });

  test('leaderboard totals points across finished matches', async ({ page }) => {
    await expect(page.getByTestId('leaderboard')).toBeVisible();
    await expect(page.getByTestId('leaderboard-points-u-alice')).toHaveText('3');
  });
});
