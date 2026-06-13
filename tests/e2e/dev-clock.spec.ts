import { expect, test } from '@playwright/test';

// FIXED sits before m072 (Jun 28) so it is open for betting; the dev clock
// override is used to jump past kickoff and prove locking follows the override.
const FIXED = new Date('2026-06-15T12:00:00Z');

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FIXED });
  await page.goto('/');
  await page.getByTestId('site-nav').waitFor();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('site-nav').waitFor();
  await page.getByTestId('new-user-input').fill('Alice');
  await page.getByTestId('add-user-btn').click();
  await expect(page.getByTestId('active-user')).toHaveText('Alice');
});

test.describe('Phase 7 — dev clock override', () => {
  test('overriding "now" past kickoff locks an open bet', async ({ page }) => {
    // m072 is open at the installed clock: its score inputs are editable.
    await expect(page.getByTestId('bet-home-m072')).toBeVisible();
    await page.getByTestId('bet-home-m072').fill('2');
    await page.getByTestId('bet-away-m072').fill('1');

    // Jump the dev clock far past m072's kickoff.
    await page.getByTestId('dev-clock').locator('summary').click();
    await page.getByTestId('dev-clock-input').fill('2026-12-01T12:00');
    await page.getByTestId('dev-clock-apply').click();

    // The bet is now locked (read-only) without any reload.
    await expect(page.getByTestId('bet-readonly-m072')).toBeVisible();
    await expect(page.getByTestId('bet-home-m072')).toHaveCount(0);

    // Clearing the override restores the live (installed) clock → editable again.
    await page.getByTestId('dev-clock-clear').click();
    await expect(page.getByTestId('bet-home-m072')).toBeVisible();
  });
});
