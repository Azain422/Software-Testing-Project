import { test, expect } from '../fixtures/testSetup.js';
import loginData from '../testdata/loginData.json';
import uiData from '../testdata/uiData.json';
import LoginPage from '../pages/LoginPage.js';
import SearchHotelPage from '../pages/SearchHotelPage.js';
import SelectHotelPage from '../pages/SelectHotelPage.js';
import { attachStepScreenshot, attachScreenshotAfterEach } from '../utilities/screenshot.js';
import logger from '../utilities/logger.js';

test.describe('Search Hotel', () => {
  test.beforeAll(async ({ browser }) => {
    logger.info(`Search Hotel suite started on ${browser.browserType().name()} ${browser.version()}`);
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const data = loginData.validUsers[0];
    await loginPage.login(data.username, data.password);
    await expect(loginPage.message.first()).toHaveText(data.ExpectedMsg);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachScreenshotAfterEach(page, testInfo);
  });

  test.afterAll(async () => {
    logger.info('Search Hotel suite finished');
  });

  test('TC07 - Navigate between pages using the menu', async ({ page }) => {
    const searchPage = new SearchHotelPage(page);

    for (const link of uiData.navigation) {
      await test.step(`Open ${link.page}`, async () => {
        await searchPage.clickMenuLink(link.page);
        await expect(page).toHaveURL(new RegExp(link.page));
        await expect(page.locator('.login_title').first()).toContainText(link.heading);
        await attachStepScreenshot(page, link.page);
      });
    }
  });

  test('TC08 - Search hotel with valid details', async ({ page }) => {
    const searchPage = new SearchHotelPage(page);
    const selectPage = new SelectHotelPage(page);
    const data = uiData.validSearch;

    await test.step('Fill search form and submit', async () => {
      await searchPage.searchHotel(data);
    });

    await test.step('Verify search results', async () => {
      await expect(selectPage.title).toHaveText(data.ExpectedTitle);
      await expect(selectPage.hotelNames.first()).toHaveValue(data.hotel);
      await expect(selectPage.locations.first()).toHaveValue(data.location);
      await attachStepScreenshot(page, 'Search results');
    });
  });

  test('TC09 - Search hotel without selecting location', async ({ page }) => {
    const searchPage = new SearchHotelPage(page);
    const data = uiData.noLocationSearch;

    await test.step('Submit search without location', async () => {
      await searchPage.searchHotel(data);
    });

    await test.step('Verify location error message', async () => {
      await expect(searchPage.locationError).toHaveText(data.ExpectedError);
      await expect(page).toHaveURL(/SearchHotel\.php/);
    });
  });
});
