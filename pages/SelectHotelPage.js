import BasePage from './BasePage.js';

class SelectHotelPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.locator('.login_title');
    this.hotelNames = page.locator('input[id^="hotel_name_"]');
    this.locations = page.locator('input[id^="location_"]');
    this.continueButton = page.locator('#continue');
  }
}

export default SelectHotelPage;
