import { test as base, expect } from '@playwright/test';

/**
 * Shared test fixture that stubs every default results source with empty payloads
 * before each test. The app auto-syncs on load (viewer mode is the default), so
 * without these stubs every spec would hit the real network. Individual specs can
 * register their own routes in `beforeEach`; those run later and take precedence.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/2026--usa/cup.txt', (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: '' }),
    );
    await page.route('**/2026--usa/cup_finals.txt', (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: '' }),
    );
    await page.route('**thesportsdb.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [] }),
      }),
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not a React hook
    await use(page);
  },
});

export { expect };
