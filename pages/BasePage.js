import config from '../utilities/config.js';
import { waitForVisible, waitForPageLoad } from '../utilities/waits.js';
import { attachStepScreenshot } from '../utilities/screenshot.js';
import logger from '../utilities/logger.js';

class BasePage {
  constructor(page) {
    this.page = page;
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.loginButton = page.locator('#login');
    this.logoutLink = page.locator('a[href="Logout.php"]');
    this.logoutMessage = page.locator('.reg_success');
  }

  async navigate(url, timeout = config.longWait) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  }

  async navigateTo(pageName) {
    logger.info(`Navigating to ${pageName}`);
    await this.navigate(config.baseURL + pageName);
  }

  async clickMenuLink(pageName) {
    logger.info(`Clicking menu link ${pageName}`);
    await this.page.locator(`a[href="${pageName}"]`).first().click();
    await waitForPageLoad(this.page);
  }

  async login(username, password) {
    logger.info(`Logging in as "${username}"`);
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
    await waitForPageLoad(this.page);
  }

  async logout() {
    logger.info('Logging out');
    await this.logoutLink.first().click();
    await waitForVisible(this.logoutMessage);
  }

  async waitForElement(locator, timeout) {
    await waitForVisible(locator, timeout);
  }

  async takeScreenshot(name) {
    await attachStepScreenshot(this.page, name);
  }

  async handleAlert(trigger, accept = true) {
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      logger.info(`Dialog (${dialog.type()}): ${message}`);
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    await trigger.click();
    return message;
  }
}

export default BasePage;
