import { expect, test } from '@playwright/test';

test.describe('Phase 1 — tournament data overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the app title and headline stats', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'World Cup 2026',
    );
    const stats = page.getByTestId('stats');
    await expect(stats).toContainText('48');
    await expect(stats).toContainText('12');
    await expect(stats).toContainText('104');
  });

  test('renders all 12 groups with 4 teams each', async ({ page }) => {
    const grid = page.getByTestId('groups-grid');
    const cards = grid.locator('.group-card');
    await expect(cards).toHaveCount(12);

    for (const letter of ['A', 'B', 'L']) {
      const card = page.getByTestId(`group-${letter}`);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(
        `Group ${letter}`,
      );
      await expect(card.locator('li')).toHaveCount(4);
    }
  });

  test('shows a known group composition (Group A)', async ({ page }) => {
    const groupA = page.getByTestId('group-A');
    await expect(groupA).toContainText('Mexico');
    await expect(groupA).toContainText('South Africa');
    await expect(groupA).toContainText('South Korea');
    await expect(groupA).toContainText('Czech Republic');
  });

  test('lists upcoming matches with kickoff times', async ({ page }) => {
    const list = page.getByTestId('upcoming-list');
    await expect(list.locator('.match-row')).toHaveCount(6);
    await expect(list.locator('.match-row').first()).toContainText('UTC');
    await expect(
      list.locator('.match-row').first().locator('.badge'),
    ).toHaveText('scheduled');
  });
});
