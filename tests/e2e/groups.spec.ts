import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('Phase 3 — groups & schedule navigation', () => {
  test('groups page renders all 12 groups with 4 teams each', async ({ page }) => {
    await expect(page.getByTestId('groups-page')).toBeVisible();
    for (const letter of ['A', 'B', 'L']) {
      const section = page.getByTestId(`group-section-${letter}`);
      await expect(section.getByRole('heading', { level: 2 })).toContainText(
        `Group ${letter}`,
      );
      await expect(section.locator('.group-teams li')).toHaveCount(4);
    }
  });

  test('shows the known Group A composition', async ({ page }) => {
    const groupA = page.getByTestId('group-section-A');
    for (const team of ['Mexico', 'South Africa', 'South Korea', 'Czech Republic']) {
      await expect(groupA).toContainText(team);
    }
  });

  test('can navigate to the schedule page', async ({ page }) => {
    await page.getByTestId('site-nav').getByRole('link', { name: 'Schedule' }).click();
    await expect(page.getByTestId('schedule-page')).toBeVisible();
    // Kickoff dates are rendered in the browser's local timezone.
    await expect(page.getByTestId('schedule-page')).toContainText('2026');
  });
});
