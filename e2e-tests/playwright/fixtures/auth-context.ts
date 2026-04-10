import { test as base, BrowserContext } from '@playwright/test';
import { loginAAP } from '../utils/auth';

/**
 * Shared authenticated browser context fixture.
 *
 * Each Playwright worker gets ONE persistent browser context with a live
 * OAuth session. Individual tests receive fresh pages inside that context,
 * so cookies (including rotated refresh tokens) are preserved across tests
 * without needing storageState files.
 *
 * Why not storageState?  The AAP OAuth backend rotates the refresh token on
 * every use. Playwright's storageState creates a NEW context per test with
 * the SAME (stale) cookies, so the second test always fails.  A shared
 * context avoids this because cookies are updated in-place.
 */
export const test = base.extend<
  // per-test fixtures (empty — page is overridden below)
  Record<string, never>,
  // worker-scoped fixtures
  { workerContext: BrowserContext }
>({
  workerContext: [
    async ({ browser }, use) => {
      console.log('[Auth] Creating shared context, logging in...');
      const context = await browser.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:7071',
        ignoreHTTPSErrors: true,
        viewport: { width: 1920, height: 1080 },
      });

      // Set default timeouts matching playwright.config.ts
      context.setDefaultNavigationTimeout(
        process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT
          ? parseInt(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT)
          : 30000,
      );
      context.setDefaultTimeout(
        process.env.PLAYWRIGHT_ACTION_TIMEOUT
          ? parseInt(process.env.PLAYWRIGHT_ACTION_TIMEOUT)
          : 30000,
      );

      const page = await context.newPage();
      await loginAAP(page);
      await page.close();
      console.log('[Auth] Shared context ready');

      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Each test gets a fresh page in the shared authenticated context.
  // The warmup navigation ensures the SPA is fully initialized (JS bundles
  // cached, auth cookies processed) before the test's own beforeEach runs.
  page: async ({ workerContext }, use) => {
    const page = await workerContext.newPage();

    // Warm up: cold SPA start from about:blank can take 15-30s on CI.
    // Navigating here absorbs that cost so the test's goto is fast.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('main')
      .waitFor({ state: 'visible', timeout: 45000 })
      .catch(() => {});

    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
