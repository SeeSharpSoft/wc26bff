import { expect, test } from '@playwright/test';

// A fixed clock so locking is deterministic: 2026-06-15 sits after the opener
// (m001, Jun 11 = locked) but before the late group matches (m072, Jun 28 =
// open for betting).
const FIXED = new Date('2026-06-15T12:00:00Z');

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FIXED });
  await page.goto('/');
  await page.getByTestId('site-nav').waitFor();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('site-nav').waitFor();
});

async function addUser(page: import('@playwright/test').Page, name: string) {
  await page.getByTestId('new-user-input').fill(name);
  await page.getByTestId('add-user-btn').click();
  await expect(page.getByTestId('active-user')).toHaveText(name);
}

test.describe('Phase 3 — betting & locking', () => {
  test('an open match prompts to add a user before betting', async ({ page }) => {
    await expect(page.getByTestId('bet-hint-m072')).toBeVisible();
  });

  test('places a bet on an open match and persists it across reload', async ({
    page,
  }) => {
    await addUser(page, 'Alice');

    await page.getByTestId('bet-home-m072').fill('2');
    await page.getByTestId('bet-away-m072').fill('1');

    await page.reload();

    await expect(page.getByTestId('bet-home-m072')).toHaveValue('2');
    await expect(page.getByTestId('bet-away-m072')).toHaveValue('1');
  });

  test('a started match is locked with no editable inputs', async ({ page }) => {
    await addUser(page, 'Alice');

    const locked = page.getByTestId('locked-m001');
    await expect(locked).toBeVisible();
    await expect(page.getByTestId('bet-home-m001')).toHaveCount(0);
  });

  test('bets are isolated per user', async ({ page }) => {
    await addUser(page, 'Alice');
    await page.getByTestId('bet-home-m072').fill('3');
    await page.getByTestId('bet-away-m072').fill('0');

    await addUser(page, 'Bob');
    // Bob is now active and has no bet on this match.
    await expect(page.getByTestId('bet-home-m072')).toHaveValue('');
    await expect(page.getByTestId('bet-away-m072')).toHaveValue('');

    // Switching back to Alice restores her bet.
    await page.getByTestId('user-select').selectOption({ label: 'Alice' });
    await expect(page.getByTestId('bet-home-m072')).toHaveValue('3');
    await expect(page.getByTestId('bet-away-m072')).toHaveValue('0');
  });
});
