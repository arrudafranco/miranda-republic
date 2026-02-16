/**
 * Cross-browser smoke tests using Playwright.
 * Tests that the game loads and core UI elements render in Chromium, Firefox, and WebKit.
 *
 * Requires a dev server running (or adjust TEST_URL).
 * Install browsers first: npx playwright install chromium firefox webkit
 *
 * Run separately from unit tests:
 *   TEST_URL=http://localhost:5173/miranda-republic/ npm run test:browsers
 */
import { describe, it, expect, afterAll } from 'vitest';
import { chromium, firefox, webkit, type Browser, type Page } from 'playwright';

// Use TEST_URL (not BASE_URL, which Vite overrides internally)
const TEST_URL = process.env.TEST_URL || 'http://localhost:5173/miranda-republic/';

const browsers = [
  { name: 'Chromium', launcher: chromium },
  { name: 'Firefox', launcher: firefox },
  { name: 'WebKit', launcher: webkit },
];

const openBrowsers: Browser[] = [];

afterAll(async () => {
  for (const b of openBrowsers) {
    await b.close();
  }
});

async function smokeTest(page: Page) {
  // 1. Navigate and verify title
  await page.goto(TEST_URL, { waitUntil: 'networkidle' });
  const title = await page.title();
  expect(title).toBe('Miranda Republic');

  // 2. Difficulty selection screen renders
  await page.getByRole('heading', { name: 'The Miranda Republic' }).waitFor({ state: 'visible', timeout: 5000 });

  // 3. Three difficulty buttons visible
  for (const name of ['Story', 'Standard', 'Crisis']) {
    const count = await page.getByRole('button', { name: new RegExp(name, 'i') }).count();
    expect(count).toBeGreaterThan(0);
  }

  // 4. Click Standard to start a game
  await page.getByRole('button', { name: /Standard/i }).click();

  // 5. Tutorial dialog should appear - skip it
  await page.getByRole('dialog').first().waitFor({ state: 'visible', timeout: 5000 });
  const skipBtn = page.getByRole('button', { name: 'Skip tutorial' });
  if (await skipBtn.count() > 0) {
    await skipBtn.click();
  }

  // 6. Dismiss all remaining modals (inauguration, events, etc.)
  //    Keep clicking the first visible button in any dialog until no dialogs remain
  for (let attempt = 0; attempt < 10; attempt++) {
    await page.waitForTimeout(500);
    const visibleDialogs = page.locator('dialog[open]');
    const count = await visibleDialogs.count();
    if (count === 0) break;

    // Click the first button in the first open dialog
    const firstDialog = visibleDialogs.first();
    const buttons = firstDialog.locator('button');
    const btnCount = await buttons.count();
    if (btnCount > 0) {
      await buttons.first().click();
    } else {
      break;
    }
  }

  // 7. Main game UI should now be visible - verify key elements
  //    Use page.locator with text for more reliable matching
  const mainTitle = page.locator('h1:has-text("MIRANDA REPUBLIC")');
  await mainTitle.waitFor({ state: 'visible', timeout: 10000 });

  // 8. Resources section visible
  const resources = page.locator('h3:has-text("Resources"), h2:has-text("Resources")');
  expect(await resources.count()).toBeGreaterThan(0);

  // 9. Some bloc content visible (overview or detail mode)
  const blocContent = page.locator('[data-tutorial="blocs"]');
  expect(await blocContent.count()).toBeGreaterThan(0);

  // 10. If we got this far with no crashes, the browser renders the app correctly
}

for (const { name, launcher } of browsers) {
  describe(`${name} smoke test`, () => {
    it('loads the game and renders core UI', async () => {
      let browser: Browser;
      try {
        browser = await launcher.launch({ headless: true });
      } catch (err) {
        // Browser not installed, skip gracefully
        console.warn(`${name} not installed, skipping. Run: npx playwright install ${name.toLowerCase()}`);
        return;
      }
      openBrowsers.push(browser);

      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      await smokeTest(page);

      await context.close();
    });
  });
}
