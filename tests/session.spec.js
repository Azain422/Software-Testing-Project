import { test, expect } from '../fixtures/testSetup.js';
import loginData from '../testdata/loginData.json';
import uiData from '../testdata/uiData.json';
import LoginPage from '../pages/LoginPage.js';
import SearchHotelPage from '../pages/SearchHotelPage.js';
import { attachStepScreenshot, attachScreenshotAfterEach } from '../utilities/screenshot.js';
import logger from '../utilities/logger.js';

test.describe('Session Security', () => {
  test.beforeAll(async ({ browser }) => {
    logger.info(`Session suite started on ${browser.browserType().name()} ${browser.version()}`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachScreenshotAfterEach(page, testInfo);
  });

  test.afterAll(async () => {
    logger.info('Session suite finished');
  });

  test('TC12 - Logout should end a stolen session', async ({ page, context, browser }) => {
    const loginPage = new LoginPage(page);
    const data = loginData.validUsers[0];
    const session = uiData.session;

    await loginPage.login(data.username, data.password);
    await expect(loginPage.message.first()).toHaveText(data.ExpectedMsg);

    // second browser context plays the attacker who got hold of the session cookie
    const attackerContext = await browser.newContext();
    const attackerPage = await attackerContext.newPage();
    const attacker = new SearchHotelPage(attackerPage);

    await test.step('Copy session cookie into a second browser', async () => {
      const cookies = await context.cookies();
      const sessionCookie = cookies.filter((c) => c.name === session.cookieName);
      expect(sessionCookie).toHaveLength(1);
      await attackerContext.addCookies(sessionCookie);
    });

    await test.step('Second browser can open protected page with the copied cookie', async () => {
      await attacker.navigateTo(session.protectedPage);
      await expect(attacker.usernameShow).toHaveValue(`Hello ${data.username}!`);
      await attachStepScreenshot(attackerPage, 'Attacker logged in with copied cookie');
    });

    await test.step('Real user logs out', async () => {
      await loginPage.logout();
      await expect(loginPage.logoutMessage).toContainText(loginData.logoutMsg);
    });

    await test.step('Copied cookie no longer works', async () => {
      await attacker.navigateTo(session.protectedPage);
      await expect(attackerPage).toHaveURL(new RegExp(session.loginPage));
      await expect(attacker.usernameShow).toHaveCount(0);
      await attachStepScreenshot(attackerPage, 'Attacker redirected to login');
    });

    await attackerContext.close();
  });
});
