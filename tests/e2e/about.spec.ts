import { test, expect } from './fixtures';
import { openUserMenu } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('site-nav').waitFor();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('site-nav').waitFor();
});

test.describe('About dialog', () => {
  test('opens from the user menu and shows key info + repo link', async ({ page }) => {
    await openUserMenu(page);
    await page.getByTestId('about-btn').click();

    // Opening About closes the menu.
    await expect(page.getByTestId('user-menu')).toBeHidden();

    const dialog = page.getByTestId('about-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('World Cup 2026');
    await expect(dialog).toContainText('in your browser');
    await expect(dialog).toContainText('Sync results');

    const repo = page.getByTestId('about-repo-link');
    await expect(repo).toHaveAttribute('href', 'https://github.com/SeeSharpSoft/wc26bff');
    await expect(repo).toHaveAttribute('target', '_blank');
  });

  test('closes via the close button and via Escape', async ({ page }) => {
    await openUserMenu(page);
    await page.getByTestId('about-btn').click();
    await page.getByTestId('about-close').click();
    await expect(page.getByTestId('about-dialog')).toBeHidden();

    await openUserMenu(page);
    await page.getByTestId('about-btn').click();
    await expect(page.getByTestId('about-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('about-dialog')).toBeHidden();
  });
});
