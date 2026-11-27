import { test, expect } from '../fixtures/testSetup.js';
import loginData from '../testdata/loginData.json';
import uiData from '../testdata/uiData.json';
import LoginPage from '../pages/LoginPage.js';
import BookedItineraryPage from '../pages/BookedItineraryPage.js';
import { attachStepScreenshot, attachScreenshotAfterEach } from '../utilities/screenshot.js';
import logger from '../utilities/logger.js';

test.describe('Booked Itinerary', () => {
  test.beforeAll(async ({ browser }) => {
    logger.info(`Booked Itinerary suite started on ${browser.browserType().name()} ${browser.version()}`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachScreenshotAfterEach(page, testInfo);
  });

  test.afterAll(async () => {
    logger.info('Booked Itinerary suite finished');
  });

  test('TC10 - Handle cancel booking confirmation popup', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const itineraryPage = new BookedItineraryPage(page);
    const data = loginData.validUsers[0];

    await loginPage.login(data.username, data.password);

    await test.step('Open Booked Itinerary page', async () => {
      await itineraryPage.openItinerary();
      await expect(itineraryPage.title).toHaveText(uiData.itinerary.ExpectedTitle);
    });

    await test.step('Click Cancel and dismiss the confirm popup', async () => {
      const message = await itineraryPage.cancelFirstBooking(false);
      expect(message).toContain(uiData.itinerary.ExpectedDialog);
      await expect(itineraryPage.cancelButtons.first()).toBeVisible();
      await attachStepScreenshot(page, 'After dismissing popup');
    });
  });
});
