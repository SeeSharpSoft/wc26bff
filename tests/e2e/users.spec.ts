import { expect, test } from '@playwright/test';

// Each test starts from a clean localStorage so users don't leak between cases.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('Phase 2 — user management', () => {
  test('starts with no users', async ({ page }) => {
    await expect(page.getByTestId('no-users')).toBeVisible();
    await expect(page.getByTestId('active-user-banner')).toContainText('No active user');
  });

  test('adding a user makes them active', async ({ page }) => {
    await page.getByTestId('new-user-input').fill('Alice');
    await page.getByTestId('add-user-btn').click();

    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await expect(page.getByTestId('active-user-banner')).toContainText('Betting as Alice');
    await expect(page.getByTestId('new-user-input')).toHaveValue('');
  });

  test('can switch between multiple users', async ({ page }) => {
    for (const name of ['Alice', 'Bob']) {
      await page.getByTestId('new-user-input').fill(name);
      await page.getByTestId('add-user-btn').click();
    }
    // Bob was added last and becomes active.
    await expect(page.getByTestId('active-user')).toHaveText('Bob');

    await page.getByTestId('user-select').selectOption({ label: 'Alice' });
    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await expect(page.getByTestId('active-user-banner')).toContainText('Betting as Alice');
  });

  test('persists users and the active selection across reload', async ({ page }) => {
    for (const name of ['Alice', 'Bob']) {
      await page.getByTestId('new-user-input').fill(name);
      await page.getByTestId('add-user-btn').click();
    }
    await page.getByTestId('user-select').selectOption({ label: 'Alice' });

    await page.reload();

    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    const options = page.getByTestId('user-select').locator('option');
    await expect(options).toHaveCount(2);
  });

  test('removing the active user falls back to another user', async ({ page }) => {
    for (const name of ['Alice', 'Bob']) {
      await page.getByTestId('new-user-input').fill(name);
      await page.getByTestId('add-user-btn').click();
    }
    // Active is Bob; accept the confirm dialog and remove him.
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('remove-user-btn').click();

    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await expect(page.getByTestId('user-select').locator('option')).toHaveCount(1);
  });
});
