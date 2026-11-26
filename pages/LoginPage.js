import { test } from '../fixtures/testSetup.js';
import BasePage from './BasePage.js';
import { attachStepScreenshot } from '../utilities/screenshot.js';

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.message = page.locator('.welcome_menu');
    this.errorMessage = page.locator('.auth_error');
    this.usernameError = page.locator('#username_span');
  }

  async login(username, password) {
    await test.step(`Login with username "${username}"`, async () => {
      await this.username.fill(username);
      await this.password.fill(password);
      await attachStepScreenshot(this.page, 'Credentials entered');
      await this.loginButton.click();
      await attachStepScreenshot(this.page, 'After login click');
    });
  }
}

export default LoginPage;
