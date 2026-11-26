import { test as base } from '@playwright/test';
import BasePage from '../pages/BasePage.js';
import logger from '../utilities/logger.js';
import config from '../utilities/config.js';

// hooks written at the top of this file only attach to the first spec that imports it,
// so per-test setup and teardown live in this auto fixture instead
export const test = base.extend({
  pageSetup: [
    async ({ page }, use, testInfo) => {
      logger.startTest(testInfo.title);
      const basePage = new BasePage(page);
      await basePage.navigate(config.baseURL);

      await use();

      logger.info(`Test finished: ${testInfo.title} - ${testInfo.status} (${testInfo.duration} ms)`);
      if (testInfo.error) {
        logger.error(testInfo.error.message);
      }
      await logger.attachLogs(testInfo);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
