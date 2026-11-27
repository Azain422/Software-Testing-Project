import BasePage from './BasePage.js';
import config from '../utilities/config.js';

class BookedItineraryPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.locator('.login_title');
    this.cancelButtons = page.locator('input[id^="btn_id_"]');
  }

  async openItinerary() {
    await this.page.goto(config.baseURL + 'BookedItinerary.php', { waitUntil: 'commit', timeout: config.longWait });
    await this.waitForElement(this.cancelButtons, config.longWait);
  }

  async cancelFirstBooking(accept) {
    return await this.handleAlert(this.cancelButtons.first(), accept);
  }
}

export default BookedItineraryPage;
