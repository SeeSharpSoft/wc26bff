import { test, expect } from './fixtures';
import { addUser, deleteUser, openUserMenu, switchUser } from './helpers';

// Each test starts from a clean localStorage so users don't leak between cases.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('Phase 2 — user management', () => {
  test('starts in viewer mode with no users', async ({ page }) => {
    // The app defaults to viewer mode; the trigger shows it directly.
    await expect(page.getByTestId('viewer-active')).toBeVisible();
    await expect(page.getByTestId('active-user-banner')).toContainText('Viewer mode');

    // The user list is empty until one is added.
    await openUserMenu(page);
    await expect(page.getByTestId('user-menu-empty')).toBeVisible();
  });

  test('adding a user makes them active', async ({ page }) => {
    await addUser(page, 'Alice');

    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await expect(page.getByTestId('active-user-banner')).toContainText('Betting as Alice');

    // The add input is reset (re-open the menu to inspect it).
    await openUserMenu(page);
    await expect(page.getByTestId('new-user-input')).toHaveValue('');
  });

  test('the menu closes after adding a user', async ({ page }) => {
    await addUser(page, 'Alice');
    await expect(page.getByTestId('user-menu')).toBeHidden();
  });

  test('can switch between multiple users', async ({ page }) => {
    await addUser(page, 'Alice');
    await addUser(page, 'Bob');
    // Bob was added last and becomes active.
    await expect(page.getByTestId('active-user')).toHaveText('Bob');

    await switchUser(page, 'Alice');
    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await expect(page.getByTestId('active-user-banner')).toContainText('Betting as Alice');
    // Switching closes the menu.
    await expect(page.getByTestId('user-menu')).toBeHidden();
  });

  test('persists users and the active selection across reload', async ({ page }) => {
    await addUser(page, 'Alice');
    await addUser(page, 'Bob');
    await switchUser(page, 'Alice');

    await page.reload();

    // A reload starts in viewer mode; the stored users persist, so switching
    // back to Alice proves the selection survived.
    await switchUser(page, 'Alice');
    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await openUserMenu(page);
    await expect(
      page.getByTestId('user-menu').locator('[data-testid^="select-user-"]'),
    ).toHaveCount(2);
  });

  test('removing the active user falls back to another user', async ({ page }) => {
    await addUser(page, 'Alice');
    await addUser(page, 'Bob');

    // Active is Bob; delete him via the trash icon (no confirm dialog).
    await deleteUser(page, 'Bob');

    await expect(page.getByTestId('active-user')).toHaveText('Alice');
    await openUserMenu(page);
    await expect(
      page.getByTestId('user-menu').locator('[data-testid^="select-user-"]'),
    ).toHaveCount(1);
  });
});
