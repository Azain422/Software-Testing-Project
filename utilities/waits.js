import config from './config.js';

export async function waitForVisible(locator, timeout = config.shortWait) {
  await locator.first().waitFor({ state: 'visible', timeout });
}

export async function waitForHidden(locator, timeout = config.shortWait) {
  await locator.first().waitFor({ state: 'hidden', timeout });
}

export async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function waitForUrl(page, urlPart, timeout = config.longWait) {
  await page.waitForURL(`**/${urlPart}*`, { timeout, waitUntil: 'domcontentloaded' });
}
