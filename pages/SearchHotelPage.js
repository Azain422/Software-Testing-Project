import BasePage from './BasePage.js';
import logger from '../utilities/logger.js';

class SearchHotelPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameShow = page.locator('#username_show');
    this.location = page.locator('#location');
    this.hotels = page.locator('#hotels');
    this.roomType = page.locator('#room_type');
    this.roomNos = page.locator('#room_nos');
    this.adultRoom = page.locator('#adult_room');
    this.searchButton = page.locator('#Submit');
    this.locationError = page.locator('#location_span');
  }

  async searchHotel(data) {
    logger.info(`Searching hotels in "${data.location}"`);
    if (data.location) {
      await this.location.selectOption(data.location);
    }
    if (data.hotel) {
      await this.hotels.selectOption(data.hotel);
    }
    if (data.roomType) {
      await this.roomType.selectOption(data.roomType);
    }
    await this.roomNos.selectOption(data.rooms);
    await this.adultRoom.selectOption(data.adults);
    await this.searchButton.click();
  }
}

export default SearchHotelPage;
