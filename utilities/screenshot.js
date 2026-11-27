import { test } from '@playwright/test';
import path from 'path';
import config from './config.js';

function fileName(title) {
  return title.replace(/[^a-zA-Z0-9]+/g, '_');
}

export async function attachStepScreenshot(page, name) {
  await test.info().attach(name, {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
}

export async function attachScreenshotAfterEach(page, testInfo) {
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
