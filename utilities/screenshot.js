import { test } from '@playwright/test';
import path from 'path';
import config from './config.js';

function fileName(title) {
  return title.replace(/[^a-zA-Z0-9]+/g, '_');
}

/** During-test attachment (Allure / HTML report). Only call inside a running test. */
export async function attachStepScreenshot(page, name) {
  await test.info().attach(name, {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
}

/** Post-test screenshots for reports; use only from test.afterEach. */
export async function attachScreenshotAfterEach(page, testInfo) {
  // very long pages (like Booked Itinerary) take over a minute as full page, so only use it on normal pages
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const fullPage = pageHeight < 5000;

  await testInfo.attach('Final Screenshot', {
    body: await page.screenshot({
      fullPage,
      path: path.join(config.screenshotDir, `${fileName(testInfo.title)}.png`),
    }),
    contentType: 'image/png',
  });

  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('Failure Screenshot', {
      body: await page.screenshot({
        fullPage,
        path: path.join(config.screenshotDir, 'failed', `${fileName(testInfo.title)}.png`),
      }),
      contentType: 'image/png',
    });
  }
}
