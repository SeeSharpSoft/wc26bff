import { expect, test } from '@playwright/test';
import { addUser, openUserMenu, syncResults } from './helpers';

const FIXED = new Date('2026-06-15T12:00:00Z');

// Mocked source feed: a finished score for m072 (Jordan v Argentina) so the
// test never touches the real network.
const MOCK_CUP_TXT = `
Sun June 28
  19:00 UTC-6     Jordan  2-1 (1-0)  Argentina       @ Dallas (Arlington)
`;

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FIXED });
  await page.route('**/2026--usa/cup.txt', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: MOCK_CUP_TXT }),
  );
  await page.goto('/');
  await page.getByTestId('site-nav').waitFor();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('site-nav').waitFor();
});

test.describe('Phase 4 — results sync & scoring', () => {
  test('shows seeded results before any sync', async ({ page }) => {
    // The opener (m001) ships as a finished result in the bundled dataset.
    await expect(page.getByTestId('result-m001')).toContainText('2');
    await openUserMenu(page);
    await expect(page.getByTestId('sync-status')).toContainText('Not synced yet');
  });

  test('syncing pulls a result and scores the active user’s bet', async ({ page }) => {
    // Bet exactly the mocked outcome on m072 while it is still open.
    await addUser(page, 'Alice');
    await page.getByTestId('bet-home-m072').fill('2');
    await page.getByTestId('bet-away-m072').fill('1');

    await syncResults(page);

    // The menu closes on sync; re-open it to read the updated status.
    await openUserMenu(page);
    await expect(page.getByTestId('sync-status')).toContainText('Synced');
    await page.keyboard.press('Escape'); // close so it doesn't overlay the grid
    await expect(page.getByTestId('result-m072')).toContainText('2');
    await expect(page.getByTestId('points-m072')).toContainText('3');
  });

  test('a wrong-tendency bet scores zero points after sync', async ({ page }) => {
    await addUser(page, 'Bob');
    // Bob predicts an Argentina win; actual is a Jordan win -> 0 points.
    await page.getByTestId('bet-home-m072').fill('0');
    await page.getByTestId('bet-away-m072').fill('2');

    await syncResults(page);

    await expect(page.getByTestId('points-m072')).toContainText('0');
  });
});
