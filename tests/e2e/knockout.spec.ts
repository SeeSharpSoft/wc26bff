import { test, expect } from './fixtures';
import { switchUser } from './helpers';

const FIXED = new Date('2026-06-15T12:00:00Z');

const USER = { id: 'u-alice', name: 'Alice', createdAt: '2026-01-01T00:00:00.000Z' };

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FIXED });
  await page.goto('/');
  await page.getByTestId('site-nav').waitFor();
  await page.evaluate((user) => {
    localStorage.clear();
    localStorage.setItem('wc26.users', JSON.stringify([user]));
    localStorage.setItem('wc26.activeUserId', JSON.stringify(user.id));
  }, USER);
  await page.reload();
  await page.getByTestId('site-nav').waitFor();
  // The app starts in viewer mode; switch to the user to access bet inputs.
  await switchUser(page, USER.name);
  await page.getByTestId('site-nav').getByRole('link', { name: 'Knockout' }).click();
  await expect(page.getByTestId('knockout-page')).toBeVisible();
});

test.describe('Phase 6 — knockout stage', () => {
  test('renders all knockout stage sections', async ({ page }) => {
    for (const stage of ['round32', 'round16', 'quarter', 'semi', 'third', 'final']) {
      await expect(page.getByTestId(`knockout-stage-${stage}`)).toBeVisible();
    }
  });

  test('shows placeholder participants before teams are resolved', async ({ page }) => {
    // m073 (Round of 32) ships with placeholders 2A v 2B in bundled data.
    const card = page.getByTestId('match-m073');
    await expect(card).toBeVisible();
    await expect(card).toContainText('2A');
    await expect(card).toContainText('2B');
  });

  test('allows betting on a knockout scoreline before kickoff', async ({ page }) => {
    const card = page.getByTestId('match-m073');
    const home = card.getByTestId('bet-home-m073');
    const away = card.getByTestId('bet-away-m073');
    await home.fill('2');
    await away.fill('1');
    await page.reload();
    await page.getByTestId('site-nav').waitFor();
    // A reload starts in viewer mode again; switch back to the user.
    await switchUser(page, USER.name);
    await page.getByTestId('site-nav').getByRole('link', { name: 'Knockout' }).click();
    await expect(page.getByTestId('bet-home-m073')).toHaveValue('2');
    await expect(page.getByTestId('bet-away-m073')).toHaveValue('1');
  });
});
