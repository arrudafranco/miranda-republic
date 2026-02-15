import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Clear saved game and mark tutorial as seen for clean state
await page.goto('http://localhost:5173/fun/');
await page.evaluate(() => {
  localStorage.removeItem('miranda-save');
  localStorage.setItem('miranda-tutorial-seen', '1');
});
await page.reload();
await page.waitForTimeout(2000);

// Select Standard difficulty
const standardBtn = page.locator('button:has-text("Standard")');
if (await standardBtn.isVisible()) {
  await standardBtn.click();
  await page.waitForTimeout(1000);
}

// Screenshot 1: Initial state with event modal
await page.screenshot({ path: 'screenshots/01-event-modal.png' });

// Click the first choice in the event modal to dismiss it
const choiceBtn = page.locator('[role="dialog"] button').first();
if (await choiceBtn.isVisible()) {
  await choiceBtn.click();
  await page.waitForTimeout(500);
}

// Screenshot 2: Action phase
await page.screenshot({ path: 'screenshots/02-action-phase.png' });

// Hero screenshot: use taller viewport to capture blocs + policy cards with effect tags
await page.setViewportSize({ width: 1280, height: 1024 });
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 300));
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshot.png' });
await page.setViewportSize({ width: 1280, height: 800 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

// Full page screenshot
await page.screenshot({ path: 'screenshots/02b-action-fullpage.png', fullPage: true });

// Hover over "Turn 1/48" span
const turnSpan = page.locator('span.cursor-help').first();
await turnSpan.hover();
await page.waitForTimeout(600);
await page.screenshot({ path: 'screenshots/03-tooltip.png' });

// Hover over Colossus Alignment label
await page.locator('#colossus-alignment-label').hover();
await page.waitForTimeout(600);
await page.screenshot({ path: 'screenshots/04-colossus-tooltip.png' });

// Click Save button
const saveBtn = page.locator('button:has-text("Save")');
if (await saveBtn.isVisible()) {
  await saveBtn.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/05-save-flash.png' });
}

// Wait for Load button to appear
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/06-after-save.png' });

// Click New Game to see confirmation state
const newGameBtn = page.locator('button:has-text("New Game")');
if (await newGameBtn.isVisible()) {
  await newGameBtn.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/07-newgame-confirm.png' });
}

await browser.close();
console.log('Done! Screenshots in screenshots/');
