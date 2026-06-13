import { expect, type Page } from '@playwright/test';

/** Open the top-right user/options popup if it isn't already open. */
export async function openUserMenu(page: Page) {
  const menu = page.getByTestId('user-menu');
  if (!(await menu.isVisible().catch(() => false))) {
    await page.getByTestId('user-menu-trigger').click();
    await menu.waitFor();
  }
}

/** Add a new user via the menu; the menu closes and the user becomes active. */
export async function addUser(page: Page, name: string) {
  await openUserMenu(page);
  await page.getByTestId('new-user-input').fill(name);
  await page.getByTestId('add-user-btn').click();
  await expect(page.getByTestId('active-user')).toHaveText(name);
}

/** Switch the active user by clicking their name in the menu. */
export async function switchUser(page: Page, name: string) {
  await openUserMenu(page);
  await page.getByTestId('user-menu').getByText(name, { exact: true }).click();
  await expect(page.getByTestId('active-user')).toHaveText(name);
}

/** Delete a user via the trash icon next to their name. */
export async function deleteUser(page: Page, name: string) {
  await openUserMenu(page);
  await page.getByTestId('user-menu').getByRole('button', { name: `Delete ${name}` }).click();
}

/** Trigger a results sync from the menu (which then closes). */
export async function syncResults(page: Page) {
  await openUserMenu(page);
  await page.getByTestId('sync-btn').click();
}
