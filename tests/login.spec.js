import { test, expect } from '../fixtures/testSetup.js';
import loginData from '../testdata/loginData.json';
import LoginPage from '../pages/LoginPage.js';
import { attachStepScreenshot, attachScreenshotAfterEach } from '../utilities/screenshot.js';
import logger from '../utilities/logger.js';

test.describe('Login', () => {
  test.beforeAll(async ({ browser }) => {
    logger.info(`Login suite started on ${browser.browserType().name()} ${browser.version()}`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachScreenshotAfterEach(page, testInfo);
  });

  test.afterAll(async () => {
    logger.info('Login suite finished');
  });

  test('TC01 - Login with valid user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const data = loginData.validUsers[0];

    await loginPage.login(data.username, data.password);

    await test.step('Verify welcome message on landing page', async () => {
      await expect(loginPage.message.first()).toHaveText(data.ExpectedMsg);
      await expect(page).toHaveURL(/SearchHotel\.php/);
    });
  });

  test('TC02 - Login with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const data = loginData.invalidUsers[0];

    await loginPage.login(data.username, data.password);

    await test.step('Verify error message is shown', async () => {
      await expect(loginPage.errorMessage).toContainText(data.ExpectedError);
      await expect(loginPage.message).toHaveCount(0);
    });
  });

  test('TC03 - Login with empty username and password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const data = loginData.emptyFields;

    await loginPage.login(data.username, data.password);

    await test.step('Verify required field message', async () => {
      await expect(loginPage.usernameError).toHaveText(data.ExpectedError);
      await expect(loginPage.loginButton).toBeVisible();
    });
  });

  loginData.sqlInjection.forEach((data, index) => {
    test(`TC0${index + 4} - SQL injection on login (${data.name})`, async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.login(data.username, data.password);

      await test.step('Verify login is rejected', async () => {
        await expect(loginPage.errorMessage).toContainText(loginData.sqlExpectedError);
        await expect(loginPage.message).toHaveCount(0);
        await expect(page).not.toHaveURL(/SearchHotel\.php/);
      });

      await test.step('Verify no database error is leaked', async () => {
        for (const word of loginData.dbErrorWords) {
          await expect(page.locator('body')).not.toContainText(word);
        }
      });
    });
  });

  test('TC11 - Logout after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const data = loginData.validUsers[0];

    await loginPage.login(data.username, data.password);
    await expect(loginPage.message.first()).toHaveText(data.ExpectedMsg);

    await test.step('Logout', async () => {
      await loginPage.logout();
    });

    await test.step('Verify logout message', async () => {
      await expect(loginPage.logoutMessage).toContainText(loginData.logoutMsg);
      await attachStepScreenshot(page, 'Logged out');
    });
  });
});
